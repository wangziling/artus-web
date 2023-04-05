import { Inject, Injectable, ScopeEnum } from '@artus/core'
import {
  ARTUS_FRAMEWORK_WEB_CACHE_SERVICE,
  ARTUS_FRAMEWORK_WEB_CACHE_SERVICE_DISTRIBUTE,
  ARTUS_FRAMEWORK_WEB_CACHE_SERVICE_MEMORY
} from '../../types'
import { DistributeCache } from './distribute'
import { MemoryCache } from './memory'

@Injectable({
  id: ARTUS_FRAMEWORK_WEB_CACHE_SERVICE,
  scope: ScopeEnum.SINGLETON
})
export class CacheService {
  @Inject(ARTUS_FRAMEWORK_WEB_CACHE_SERVICE_DISTRIBUTE)
  readonly distribute: DistributeCache

  @Inject(ARTUS_FRAMEWORK_WEB_CACHE_SERVICE_MEMORY)
  readonly memory: MemoryCache
}
