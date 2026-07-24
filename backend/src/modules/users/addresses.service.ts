import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address, AddressDocument } from './schemas/address.schema';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
  ) {}

  async create(userId: string, data: Partial<Address>): Promise<AddressDocument> {
    // If setting default, reset others first
    if (data.isDefault) {
      await this.addressModel.updateMany(
        { user: new Types.ObjectId(userId) },
        { isDefault: false },
      );
    }

    // Check if this is the first address, if so, make it default automatically
    const count = await this.addressModel.countDocuments({
      user: new Types.ObjectId(userId),
      isDeleted: false,
    });
    const isDefault = count === 0 ? true : !!data.isDefault;

    const address = new this.addressModel({
      ...data,
      user: new Types.ObjectId(userId),
      isDefault,
    });
    return address.save();
  }

  async findByUser(userId: string): Promise<AddressDocument[]> {
    return this.addressModel
      .find({ user: new Types.ObjectId(userId), isDeleted: false })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  async findById(id: string, userId: string): Promise<AddressDocument> {
    const address = await this.addressModel
      .findOne({ _id: new Types.ObjectId(id), user: new Types.ObjectId(userId), isDeleted: false })
      .exec();
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ');
    }
    return address;
  }

  async update(id: string, userId: string, data: Partial<Address>): Promise<AddressDocument> {
    const address = await this.findById(id, userId);

    if (data.isDefault && !address.isDefault) {
      await this.addressModel.updateMany(
        { user: new Types.ObjectId(userId) },
        { isDefault: false },
      );
    }

    Object.assign(address, data);
    return address.save();
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const address = await this.findById(id, userId);
    address.isDeleted = true;
    
    // If we deleted the default address, set another address as default
    if (address.isDefault) {
      address.isDefault = false;
      await address.save();
      
      const nextAddress = await this.addressModel
        .findOne({ user: new Types.ObjectId(userId), isDeleted: false })
        .exec();
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    } else {
      await address.save();
    }
  }

  async setDefault(id: string, userId: string): Promise<AddressDocument> {
    await this.addressModel.updateMany(
      { user: new Types.ObjectId(userId) },
      { isDefault: false },
    );
    const address = await this.findById(id, userId);
    address.isDefault = true;
    return address.save();
  }
}
