export { Application } from './Application';
export { Router } from './Router';

export type { FRequest } from './FRequest';
export type { FResponse } from './FResponse';

export type {
    HttpMethod,
    RequestContext,
    RouteParams,
    QueryParams,
    RequestHandler,
    RouteHookType,
    LifecycleHookType,
    AppRequestHookType,
    HookFn,
    ErrorHookFn,
    LifecycleHookFn,
    PathSegmentHooksStore,
} from './types';

export { SegmentType } from './types';

// TODO: переделать этот кусок говна. Из полезного - FRequest.readBody, FResponse.stream, granual хуки и radix-tree роутер. Остальное - мусор.
// TODO: ещё надо добавить куки парсер встроенный, а freq readbody через генераторы сделать обязательно как в learning
