import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ApiKeyGuard extends AuthGuard('apiKey') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request.path === '/health') return true;
    return super.canActivate(context);
  }
}
