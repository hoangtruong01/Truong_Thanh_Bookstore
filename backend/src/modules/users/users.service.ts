import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole, LoyaltyTier } from '../../common/enums';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findByIdWithPassword(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findAll(query: any = {}): Promise<UserDocument[]> {
    return this.userModel.find(query).select('-password').exec();
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.userModel.countDocuments({ role }).exec();
  }

  async update(id: string, data: Partial<User>): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .select('-password')
      .exec();
  }

  async toggleWishlist(userId: string, productId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');
    
    if (!user.wishlist) {
      user.wishlist = [];
    }

    const prodId = new Types.ObjectId(productId);
    const index = user.wishlist.findIndex((id) => id.toString() === productId);
    
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(prodId);
    }

    await user.save();
    return user.wishlist.map(id => id.toString());
  }

  async getWishlist(userId: string): Promise<any[]> {
    const user = await this.userModel.findById(userId)
      .populate({
        path: 'wishlist',
        match: { isDeleted: false },
        populate: { path: 'category', select: 'name' }
      })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user.wishlist || [];
  }

  // ── Loyalty Points System ──

  private calculateTier(points: number): LoyaltyTier {
    if (points >= 5000) return LoyaltyTier.DIAMOND;
    if (points >= 2000) return LoyaltyTier.GOLD;
    if (points >= 500) return LoyaltyTier.SILVER;
    return LoyaltyTier.BRONZE;
  }

  async addLoyaltyPoints(
    userId: string,
    points: number,
  ): Promise<{ user: UserDocument; tierUpgraded: boolean; oldTier: LoyaltyTier; newTier: LoyaltyTier } | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const oldTier = user.loyaltyTier || LoyaltyTier.BRONZE;
    user.loyaltyPoints = (user.loyaltyPoints || 0) + points;
    const newTier = this.calculateTier(user.loyaltyPoints);
    const tierUpgraded = newTier !== oldTier;
    user.loyaltyTier = newTier;
    await user.save();
    return { user, tierUpgraded, oldTier, newTier };
  }

  async deductLoyaltyPoints(userId: string, points: number): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - points);
    user.loyaltyTier = this.calculateTier(user.loyaltyPoints);
    await user.save();
    return user;
  }

  async getLoyaltyInfo(userId: string): Promise<{ points: number; tier: string } | null> {
    const user = await this.userModel.findById(userId).select('loyaltyPoints loyaltyTier').exec();
    if (!user) return null;
    return {
      points: user.loyaltyPoints || 0,
      tier: user.loyaltyTier || LoyaltyTier.BRONZE,
    };
  }
}

