import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import {
  CampaignObjective,
  CampaignStatus,
} from './schemas/marketing-campaign.schema';

describe('CampaignsController (MKT-01)', () => {
  let controller: CampaignsController;
  let service: jest.Mocked<Partial<CampaignsService>>;

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue({ _id: 'camp_1', code: 'TEST_01' }),
      findAll: jest.fn().mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
      findById: jest.fn().mockResolvedValue({ _id: 'camp_1', code: 'TEST_01' }),
      update: jest.fn().mockResolvedValue({ _id: 'camp_1', name: 'Updated' }),
      updateStatus: jest
        .fn()
        .mockResolvedValue({ _id: 'camp_1', status: CampaignStatus.APPROVED }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignsController],
      providers: [
        {
          provide: CampaignsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CampaignsController>(CampaignsController);
  });

  it('delegates create to service', async () => {
    const dto = {
      code: 'TEST_01',
      name: 'Test',
      objective: CampaignObjective.CONVERSION,
    };
    const res = await controller.create(dto, {
      user: { userId: 'admin_1' },
    });
    expect(service.create).toHaveBeenCalledWith(dto, 'admin_1');
    expect(res).toEqual({ _id: 'camp_1', code: 'TEST_01' });
  });

  it('delegates findAll to service', async () => {
    const query = { page: 1, limit: 20 };
    await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates updateStatus to service', async () => {
    await controller.updateStatus(
      'camp_1',
      { status: CampaignStatus.APPROVED },
      { user: { userId: 'admin_1' } },
    );
    expect(service.updateStatus).toHaveBeenCalledWith(
      'camp_1',
      { status: CampaignStatus.APPROVED },
      'admin_1',
    );
  });

  it('delegates delete to service', async () => {
    await controller.delete('camp_1');
    expect(service.delete).toHaveBeenCalledWith('camp_1');
  });
});
