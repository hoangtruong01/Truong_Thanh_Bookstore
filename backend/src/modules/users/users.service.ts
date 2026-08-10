import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from '../../common/enums';

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
      .findByIdAndUpdate(id, data, { new: true })
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
}
