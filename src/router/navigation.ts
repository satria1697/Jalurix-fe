import { NavigationFailure, RouteParams, RouteParamsRaw, useRouter } from 'vue-router'

interface INavigation {
  goBack: () => void
  go: (options: {
    name?: string
    params?: RouteParamsRaw
  }) => Promise<void | NavigationFailure | undefined>
  getParams: () => RouteParams
}

export default class Navigation implements INavigation {
  router = useRouter()
  goBack() {
    this.router.back()
  }
  go(options: {
    name?: string
    params?: RouteParamsRaw
  }): Promise<void | NavigationFailure | undefined> {
    const { name, params } = options
    return this.router.push({
      name,
      params
    })
  }
  getParams() {
    return this.router.currentRoute.value.params
  }
}
