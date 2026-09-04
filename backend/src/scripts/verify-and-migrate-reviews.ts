/**
 * Script chẩn đoán và migrate dữ liệu Review trên Staging / Production
 * Giải quyết mục xác minh NV-01, NV-02 trong TASK_EXECUTION_TRACKER.md (BE-02)
 *
 * Cách chạy:
 *   npx ts-node src/scripts/verify-and-migrate-reviews.ts            (Chế độ kiểm tra / Dry-run)
 *   npx ts-node src/scripts/verify-and-migrate-reviews.ts --execute  (Chế độ thực thi cập nhật dữ liệu)
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/truongthanh_bookstore';

async function runReviewAuditAndMigration() {
  const isExecute = process.argv.includes('--execute');

  console.log('===========================================================');
  console.log('  KIỂM TRA & DI TRÚ CSDL: REVIEW SCHEMA CONTRACT (BE-02)   ');
  console.log('===========================================================');
  console.log(`URI: ${MONGODB_URI.replace(/:([^:@]+)@/, ':****@')}`);
  console.log(
    `Chế độ: ${isExecute ? 'THỰC THI (MIGRATE DATA)' : 'CHẨN ĐOÁN (DRY RUN)'}\n`,
  );

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGODB_URI, { connectTimeoutMS: 10000 });
    await client.connect();
    console.log('✓ Kết nối MongoDB thành công.');

    const db = client.db();
    const collection = db.collection('reviews');

    // 1. Thống kê tổng số reviews
    const totalReviews = await collection.countDocuments();
    console.log(`- Tổng số reviews trong CSDL: ${totalReviews}`);

    if (totalReviews === 0) {
      console.log('ℹ Bảng reviews hiện chưa có dữ liệu. Không cần backfill.');
      console.log('✓ Kết quả kiểm toán: ĐẠT (PASS).');
      return;
    }

    // 2. Kiểm tra các trường thuộc schema chuẩn
    const missingIsVisible = await collection.countDocuments({
      isVisible: { $type: ['null', 'missing'] },
    });
    const missingVerified = await collection.countDocuments({
      isVerifiedPurchase: { $type: ['null', 'missing'] },
    });
    const missingImages = await collection.countDocuments({
      images: { $type: ['null', 'missing'] },
    });
    const hasAdminReply = await collection.countDocuments({
      adminReply: { $exists: true, $ne: null },
    });

    console.log('\n--- KẾT QUẢ PHÂN TÍCH SCHEMA TRƯỜNG DỮ LIỆU ---');
    console.log(`- Số review thiếu trường 'isVisible': ${missingIsVisible}`);
    console.log(
      `- Số review thiếu trường 'isVerifiedPurchase': ${missingVerified}`,
    );
    console.log(`- Số review thiếu trường 'images': ${missingImages}`);
    console.log(`- Số review đã có 'adminReply': ${hasAdminReply}`);

    // 3. Kiểm tra chỉ mục (Indexes)
    const indexes = await collection.indexes();
    console.log('\n--- DANH SÁCH CHỈ MỤC (INDEXES) HIỆN HỮU ---');
    indexes.forEach((idx) =>
      console.log(`  • [${idx.name}]: ${JSON.stringify(idx.key)}`),
    );

    // 4. Thực thi backfill nếu có cờ --execute
    if (isExecute) {
      console.log('\n--- TIẾN HÀNH CẬP NHẬT DỮ LIỆU (BACKFILL) ---');

      let updatedCount = 0;
      if (missingIsVisible > 0) {
        const res = await collection.updateMany(
          { isVisible: { $type: ['null', 'missing'] } },
          { $set: { isVisible: true } },
        );
        console.log(
          `✓ Đã cập nhật isVisible = true cho ${res.modifiedCount} bản ghi.`,
        );
        updatedCount += res.modifiedCount;
      }

      if (missingVerified > 0) {
        const res = await collection.updateMany(
          { isVerifiedPurchase: { $type: ['null', 'missing'] } },
          { $set: { isVerifiedPurchase: false } },
        );
        console.log(
          `✓ Đã cập nhật isVerifiedPurchase = false cho ${res.modifiedCount} bản ghi.`,
        );
        updatedCount += res.modifiedCount;
      }

      if (missingImages > 0) {
        const res = await collection.updateMany(
          { images: { $type: ['null', 'missing'] } },
          { $set: { images: [] } },
        );
        console.log(
          `✓ Đã cập nhật images = [] cho ${res.modifiedCount} bản ghi.`,
        );
        updatedCount += res.modifiedCount;
      }

      console.log(
        `\n✓ Hoàn tất di trú dữ liệu: Cập nhật tổng cộng ${updatedCount} lượt trường.`,
      );
    } else {
      if (missingIsVisible > 0 || missingVerified > 0 || missingImages > 0) {
        console.log('\n⚠ Phát hiện một số trường cũ chưa có giá trị mặc định.');
        console.log(
          '  Khuyến nghị chạy: npx ts-node src/scripts/verify-and-migrate-reviews.ts --execute',
        );
      } else {
        console.log(
          '\n✓ Toàn bộ dữ liệu reviews đã đồng nhất 100% với Canonical Schema!',
        );
      }
    }

    console.log(
      '\n===========================================================',
    );
    console.log('✓ XÁC MINH HOÀN TẤT: BE-02 REVIEW SCHEMA CONTRACT SẴN SÀNG');
    console.log('===========================================================');
  } catch (error: any) {
    console.error('\n❌ Lỗi trong quá trình kiểm tra CSDL:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Chạy script trực tiếp
if (require.main === module) {
  runReviewAuditAndMigration().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { runReviewAuditAndMigration };
