import { IUseCase } from '@shared/application';
import { DashboardHealthResponseDto } from '../../dtos/dashboard-response.dto';
import { IDashboardHealthPort } from '../../ports/dashboard-health.port';
import { toDashboardHealthResponse } from '../dashboard-view.mapper';

export class GetDashboardHealthUseCase
  implements IUseCase<void, DashboardHealthResponseDto>
{
  constructor(private readonly dashboardHealthPort: IDashboardHealthPort) {}

  async execute(): Promise<DashboardHealthResponseDto> {
    const services = await this.dashboardHealthPort.checkDependencies();
    return toDashboardHealthResponse(services);
  }
}
