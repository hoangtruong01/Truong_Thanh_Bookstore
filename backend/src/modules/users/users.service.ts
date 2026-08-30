import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CartService } from '../cart/cart.service';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { UserRole, StaffPermission, LoyaltyTier } from '../../common/enums';
import {
  CreateStaffUserDto,
  UpdateUserRoleDto,
  UpdateUserPermissionsDto,
  UpdateUserStatusDto,
  UserQueryDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    @Optional() @InjectModel(Product.name) private productModel?: Model<ProductDocument>,
    @Optional() @Inject(forwardRef(() => CartService)) private cartService?: CartService,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID người dùng không đúng định dạng');
    }
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByIdWithPassword(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.userModel.findById(id).select('+password +refreshTokenHash').exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async update(id: string, data: Partial<User>): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID người dùng không đúng định dạng');
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── RBAC User Management Methods ──

  async findAllUsers(query: UserQueryDto): Promise<PaginatedResult<UserDocument>> {
    const { page = 1, limit = 10, role, status, search } = query;
    const filter: any = {};

    if (role) {
      filter.role = role;
    }

    if (status !== undefined) {
      filter.status = status;
    }

    if (search) {
      const safeSearch = search.substring(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { fullName: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { phone: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -refreshTokenHash -resetOtp')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return paginate(data, total, page, limit);
  }

  async createStaffOrAdmin(
    dto: CreateStaffUserDto,
    actor: UserRole | string | { role: UserRole | string },
  ): Promise<UserDocument> {
    const actorRole = typeof actor === 'object' && actor !== null ? actor.role : actor;
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email này đã được sử dụng');
    }

    const assignedRole = dto.role || UserRole.STAFF;

    // Hierarchy check: Only SUPER_ADMIN can create ADMIN or SUPER_ADMIN
    if (
      (assignedRole === UserRole.ADMIN || assignedRole === UserRole.SUPER_ADMIN) &&
      actorRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Chỉ Super Admin mới có quyền tạo tài khoản Admin hoặc Super Admin',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      fullName: dto.fullName,
      email: dto.email.toLowerCase().trim(),
      password: hashedPassword,
      phone: dto.phone,
      role: assignedRole,
      permissions: assignedRole === UserRole.STAFF ? dto.permissions || [] : [],
      status: true,
    });

    const saved = await user.save();
    const result = saved.toObject ? saved.toObject() : saved;
    delete (result as any).password;
    delete (result as any).refreshTokenHash;
    delete (result as any).resetOtp;
    return result as any;
  }

  async updateRole(
    targetUserId: string,
    roleOrDto: UserRole | UpdateUserRoleDto | { role: UserRole },
    actorRoleOrActor: UserRole | string | { role: UserRole | string; _id?: string },
    actorIdParam?: string,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('ID người dùng không đúng định dạng');
    }

    const newRole = typeof roleOrDto === 'object' && roleOrDto !== null ? roleOrDto.role : roleOrDto;
    let actorRole = actorRoleOrActor;
    let actorId = actorIdParam;

    if (typeof actorRoleOrActor === 'object' && actorRoleOrActor !== null) {
      actorRole = actorRoleOrActor.role;
      actorId = actorRoleOrActor._id;
    }

    if (actorId && targetUserId === actorId.toString()) {
      throw new ForbiddenException('Không thể tự thay đổi vai trò của chính mình');
    }

    const targetUser = await this.userModel.findById(targetUserId).exec();
    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Protect SUPER_ADMIN
    if (targetUser.role === UserRole.SUPER_ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Chỉ Super Admin mới có quyền chỉnh sửa tài khoản Super Admin',
      );
    }

    // Only SUPER_ADMIN can promote to SUPER_ADMIN
    if (newRole === UserRole.SUPER_ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Chỉ Super Admin mới có quyền thăng cấp thành Super Admin',
      );
    }

    // Regular ADMIN can only manage STAFF and CUSTOMER roles
    if (actorRole === UserRole.ADMIN) {
      if (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Admin không có quyền thay đổi vai trò của quản trị viên khác',
        );
      }
      if (newRole === UserRole.ADMIN || newRole === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Chỉ Super Admin mới có quyền gán vai trò Admin hoặc Super Admin',
        );
      }
    }

    targetUser.role = newRole;
    if (newRole !== UserRole.STAFF) {
      targetUser.permissions = [];
    }

    const updated = await targetUser.save();
    const result = updated.toObject ? updated.toObject() : updated;
    delete (result as any).password;
    return result as any;
  }

  async updatePermissions(
    targetUserId: string,
    permissionsOrDto: StaffPermission[] | UpdateUserPermissionsDto | { permissions: StaffPermission[] },
    actorRoleParam?: UserRole | string,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('ID người dùng không đúng định dạng');
    }

    const permissions = Array.isArray(permissionsOrDto)
      ? permissionsOrDto
      : permissionsOrDto.permissions;

    const targetUser = await this.userModel.findById(targetUserId).exec();
    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (targetUser.role !== UserRole.STAFF) {
      throw new BadRequestException('Chỉ có thể gán quyền cho tài khoản nhân viên (STAFF)');
    }

    targetUser.permissions = permissions;
    const updated = await targetUser.save();
    const result = updated.toObject ? updated.toObject() : updated;
    delete (result as any).password;
    return result as any;
  }

  async updateStatus(
    targetUserId: string,
    statusOrDto: boolean | UpdateUserStatusDto | { status: boolean },
    actorRoleOrActor: UserRole | string | { role: UserRole | string; _id?: string },
    actorIdParam?: string,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('ID người dùng không đúng định dạng');
    }

    const status = typeof statusOrDto === 'object' && statusOrDto !== null ? statusOrDto.status : statusOrDto;
    let actorRole = actorRoleOrActor;
    let actorId = actorIdParam;

    if (typeof actorRoleOrActor === 'object' && actorRoleOrActor !== null) {
      actorRole = actorRoleOrActor.role;
      actorId = actorRoleOrActor._id;
    }

    if (actorId && targetUserId === actorId.toString()) {
      throw new ForbiddenException('Không thể tự khóa tài khoản của chính mình');
    }

    const targetUser = await this.userModel.findById(targetUserId).exec();
    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Cannot lock SUPER_ADMIN
    if (targetUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Không thể khóa tài khoản Super Admin');
    }

    if (targetUser.role === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Chỉ Super Admin mới có quyền khóa tài khoản Admin',
      );
    }

    targetUser.status = status;
    const updated = await targetUser.save();
    const result = updated.toObject ? updated.toObject() : updated;
    delete (result as any).password;
    return result as any;
  }

  async deleteUser(
    targetUserId: string,
    actorRoleOrActor: UserRole | string | { role: UserRole | string; _id?: string },
    actorIdParam?: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('ID người dùng không đúng định dạng');
    }

    let actorRole = actorRoleOrActor;
    let actorId = actorIdParam;

    if (typeof actorRoleOrActor === 'object' && actorRoleOrActor !== null) {
      actorRole = actorRoleOrActor.role;
      actorId = actorRoleOrActor._id;
    }

    if (actorId && targetUserId === actorId.toString()) {
      throw new ForbiddenException('Không thể tự xóa tài khoản của chính mình');
    }

    const targetUser = await this.userModel.findById(targetUserId).exec();
    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (targetUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Không thể xóa tài khoản Super Admin');
    }

    if (targetUser.role === UserRole.ADMIN && actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Chỉ Super Admin mới có quyền xóa tài khoản Admin',
      );
    }

    await this.userModel.findByIdAndDelete(targetUserId).exec();
    return { success: true, message: 'Xóa tài khoản thành công' };
  }

  // ── Loyalty and Wishlist methods ──

  async getWishlist(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'wishlist',
        match: { isDeleted: { $ne: true } },
        select: 'name slug description price discountPrice stock images brand sku rating sold status isFeatured',
      })
      .exec();

    if (!user) throw new NotFoundException('User not found');

    const validProducts = (user.wishlist || []).filter((p: any) => p && p._id);
    const validIds = validProducts.map((p: any) => p._id.toString());

    // Clean up any stale/deleted references from wishlist
    if (user.wishlist && user.wishlist.length !== validProducts.length) {
      await this.userModel.findByIdAndUpdate(userId, {
        wishlist: validProducts.map((p: any) => p._id),
      });
    }

    return {
      products: validProducts,
      ids: validIds,
      total: validProducts.length,
    };
  }

  async toggleWishlist(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const user = await this.findById(userId);
    const wishlist = (user.wishlist || []).map((id) => id.toString());
    const index = wishlist.indexOf(productId);
    let isInWishlist = false;

    if (index > -1) {
      wishlist.splice(index, 1);
      isInWishlist = false;
    } else {
      wishlist.push(productId);
      isInWishlist = true;
    }

    const objectIdList = wishlist.map((id) => new Types.ObjectId(id));
    await this.userModel.findByIdAndUpdate(userId, { wishlist: objectIdList });

    return {
      wishlist,
      isInWishlist,
      total: wishlist.length,
    };
  }

  async removeFromWishlist(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    const user = await this.findById(userId);
    const wishlist = (user.wishlist || [])
      .map((id) => id.toString())
      .filter((id) => id !== productId);

    const objectIdList = wishlist.map((id) => new Types.ObjectId(id));
    await this.userModel.findByIdAndUpdate(userId, { wishlist: objectIdList });

    return {
      wishlist,
      isInWishlist: false,
      total: wishlist.length,
    };
  }

  async moveToCart(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('ID sản phẩm không hợp lệ');
    }

    // Add to cart if CartService is available
    if (this.cartService) {
      await this.cartService.addToCart(userId, { productId, quantity: 1 });
    }

    // Remove from wishlist
    await this.removeFromWishlist(userId, productId);

    return {
      success: true,
      message: 'Đã chuyển sản phẩm vào giỏ hàng thành công',
    };
  }

  async addLoyaltyPoints(
    userId: string,
    points: number,
  ): Promise<{ user: UserDocument; tierUpgraded: boolean; newTier: string; oldTier: string } | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const oldTier = user.loyaltyTier || LoyaltyTier.BRONZE;
    const currentPoints = user.loyaltyPoints || 0;
    const newPoints = currentPoints + points;

    let newTier: LoyaltyTier = LoyaltyTier.BRONZE;
    if (newPoints >= 10000) newTier = LoyaltyTier.DIAMOND;
    else if (newPoints >= 5000) newTier = LoyaltyTier.GOLD;
    else if (newPoints >= 2000) newTier = LoyaltyTier.SILVER;
    else newTier = LoyaltyTier.BRONZE;

    const tierHierarchy = [
      LoyaltyTier.BRONZE,
      LoyaltyTier.SILVER,
      LoyaltyTier.GOLD,
      LoyaltyTier.DIAMOND,
    ];
    const oldIndex = tierHierarchy.indexOf(oldTier);
    const newIndex = tierHierarchy.indexOf(newTier);
    const tierUpgraded = newIndex > oldIndex;

    user.loyaltyPoints = newPoints;
    user.loyaltyTier = newTier;
    const savedUser = await user.save();

    return {
      user: savedUser,
      tierUpgraded,
      newTier,
      oldTier,
    };
  }

  async deductLoyaltyPoints(
    userId: string,
    points: number,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;
    user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - points);
    return user.save();
  }

  async getLoyaltyInfo(userId: string) {
    const user = await this.findById(userId);
    const currentTier = user.loyaltyTier || LoyaltyTier.BRONZE;
    const currentPoints = user.loyaltyPoints || 0;

    const tiers = [
      { tier: LoyaltyTier.BRONZE, minPoints: 0, discountPercent: 0 },
      { tier: LoyaltyTier.SILVER, minPoints: 2000, discountPercent: 5 },
      { tier: LoyaltyTier.GOLD, minPoints: 5000, discountPercent: 10 },
      { tier: LoyaltyTier.DIAMOND, minPoints: 10000, discountPercent: 15 },
    ];

    let nextTier = null;
    let pointsToNextTier = 0;

    const currentTierIndex = tiers.findIndex((t) => t.tier === currentTier);
    if (currentTierIndex !== -1 && currentTierIndex < tiers.length - 1) {
      nextTier = tiers[currentTierIndex + 1];
      pointsToNextTier = Math.max(0, nextTier.minPoints - currentPoints);
    }

    return {
      points: currentPoints,
      tier: currentTier,
      tiers,
      nextTier: nextTier ? nextTier.tier : null,
      pointsToNextTier,
    };
  }
}
