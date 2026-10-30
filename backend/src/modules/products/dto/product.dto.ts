import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ProductStatus } from '../../../common/enums';

export class CreateProductDto {
  @ApiProperty({ example: 'Bút bi Thiên Long TL-027' })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description:
      'Mã SKU sản phẩm (bỏ trống để hệ thống tự sinh mã tuần tự SP000001)',
    example: 'SP000001',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Category ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  @IsMongoId({ message: 'Danh mục phải là ObjectId hợp lệ' })
  category: string;

  @ApiPropertyOptional({ example: 'Thiên Long' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  brand?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Nhật Ánh' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  author?: string;

  @ApiPropertyOptional({ example: 'NXB Trẻ' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  publisher?: string;

  @ApiPropertyOptional({ example: '9786045890123' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  isbn?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Năm xuất bản phải là số' })
  publicationYear?: number;

  @ApiProperty({ example: 5000 })
  @IsNotEmpty({ message: 'Giá sản phẩm không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá sản phẩm phải là số' })
  @Min(0, { message: 'Giá sản phẩm không được âm' })
  price: number;

  @ApiPropertyOptional({ example: 4000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá khuyến mãi phải là số' })
  @Min(0, { message: 'Giá khuyến mãi không được âm' })
  discountPrice?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Số lượng tồn kho phải là số' })
  @Min(0, { message: 'Tồn kho không được âm' })
  stock?: number;

  @ApiPropertyOptional({ example: 'cái' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFlashSale?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flashSaleExpiry?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Trạng thái sản phẩm không hợp lệ' })
  status?: ProductStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subOptions?: string[];

  @ApiPropertyOptional({
    description: 'Phân loại ngành hàng: BOOK, STATIONERY hoặc OTHER',
    enum: ['BOOK', 'STATIONERY', 'OTHER'],
    default: 'BOOK',
  })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({ description: 'Số trang sách', example: 250 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Số trang phải là số' })
  @Min(1, { message: 'Số trang tối thiểu là 1' })
  pages?: number;

  @ApiPropertyOptional({ description: 'Hình thức bìa', example: 'Bìa mềm' })
  @IsOptional()
  @IsString()
  coverType?: string;

  @ApiPropertyOptional({
    description: 'Khổ sách / Kích thước',
    example: '13 x 19 cm',
  })
  @IsOptional()
  @IsString()
  bookSize?: string;

  @ApiPropertyOptional({ description: 'Dịch giả', example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  translator?: string;

  @ApiPropertyOptional({ description: 'Ngôn ngữ', example: 'Tiếng Việt' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Xuất xứ / Nơi sản xuất',
    example: 'Việt Nam',
  })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ description: 'Màu sắc', example: 'Xanh dương' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Chất liệu', example: 'Nhựa cao cấp' })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional({
    description: 'Quy cách đóng gói',
    example: '20 cây / hộp',
  })
  @IsOptional()
  @IsString()
  packaging?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId({ message: 'Danh mục phải là ObjectId hợp lệ' })
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  author?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  publisher?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  isbn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Năm xuất bản phải là số' })
  publicationYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá sản phẩm phải là số' })
  @Min(0, { message: 'Giá sản phẩm không được âm' })
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá khuyến mãi phải là số' })
  @Min(0, { message: 'Giá khuyến mãi không được âm' })
  discountPrice?: number;

  // BE-04: stock is removed from generic product update.
  // All stock adjustments must go through InventoryService (/inventory/adjust or /inventory/import)

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFlashSale?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flashSaleExpiry?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Trạng thái sản phẩm không hợp lệ' })
  status?: ProductStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subOptions?: string[];

  @ApiPropertyOptional({
    description: 'Phân loại ngành hàng: BOOK, STATIONERY hoặc OTHER',
    enum: ['BOOK', 'STATIONERY', 'OTHER'],
    default: 'BOOK',
  })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({ description: 'Số trang sách', example: 250 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Số trang phải là số' })
  @Min(1, { message: 'Số trang tối thiểu là 1' })
  pages?: number;

  @ApiPropertyOptional({ description: 'Hình thức bìa', example: 'Bìa mềm' })
  @IsOptional()
  @IsString()
  coverType?: string;

  @ApiPropertyOptional({
    description: 'Khổ sách / Kích thước',
    example: '13 x 19 cm',
  })
  @IsOptional()
  @IsString()
  bookSize?: string;

  @ApiPropertyOptional({ description: 'Dịch giả', example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  translator?: string;

  @ApiPropertyOptional({ description: 'Ngôn ngữ', example: 'Tiếng Việt' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Xuất xứ / Nơi sản xuất',
    example: 'Việt Nam',
  })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ description: 'Màu sắc', example: 'Xanh dương' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Chất liệu', example: 'Nhựa cao cấp' })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional({
    description: 'Quy cách đóng gói',
    example: '20 cây / hộp',
  })
  @IsOptional()
  @IsString()
  packaging?: string;
}

export class ProductQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Category ID (Parent or Child)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Product type: BOOK, STATIONERY, OTHER',
  })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({
    description: 'Brand filter or comma-separated list of brands',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Author filter or comma-separated list of authors',
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({
    description: 'Publisher filter or comma-separated list of publishers',
  })
  @IsOptional()
  @IsString()
  publisher?: string;

  @ApiPropertyOptional({ description: 'ISBN filter' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({
    description: 'Sub-option filter (e.g. Grade, Subject)',
  })
  @IsOptional()
  @IsString()
  subOption?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Product status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description:
      'Sorting: newest, price_asc, price_desc, best_selling, rating, name_asc, name_desc, discount_desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Alias for sort parameter' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description:
      'Search term for name, description, SKU, ISBN, author, publisher, brand',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter discounted products only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  discounted?: boolean;

  @ApiPropertyOptional({ description: 'Minimum rating (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Filter in-stock status (true / false)' })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' || value === true
      ? true
      : value === 'false' || value === false
        ? false
        : value,
  )
  inStock?: boolean | string;

  @ApiPropertyOptional({ description: 'Filter active flash sale products' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isFlashSale?: boolean;
}
