import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import PrivateNote from '@/components/PrivateNote.vue'
import SignIn from '@/components/SignIn.vue'

import store from '../store'
// @ts-ignore
import { AmplifyEventBus, AmplifyPlugin } from 'aws-amplify-vue'
import * as AmplifyModules from 'aws-amplify'

Vue.use(AmplifyPlugin, AmplifyModules)
Vue.use(VueRouter)


let user: any;

function getUser() {
  return Vue.prototype.$Amplify.Auth.currentAuthenticatedUser().then((data: any) => {
    if (data && data.signInUserSession) {
      store.commit('setUser', data)
      return data;
    }
  }).catch(() => {
    store.commit('setUser', null)
    return null
  })
}

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'private_note',
      component: PrivateNote,
      meta: { requireAuth: true }
    },
    {
      path: '/signin',
      name: 'signin',
      component: SignIn
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
    }
  ]
})

getUser().then((user: any) => {
  if (user) {
    router.push({path: '/'}, () => { }, () => { });
  }
});

AmplifyEventBus.$on('authState', async (state: any) => {
  if (state === 'signedOut'){
    user = null
    store.commit('setUser', null)
    router.push({path: '/signin'}, () => {}, () => {})
  } else if (state === 'signedIn') {
    user = await getUser();
    router.push({path: '/'}, () => {}, () => {})
  }
});

router.beforeResolve(async (to, from, next) => {
  if (to.matched.some(record => record.meta.requireAuth)) {
    user = await getUser();
    if (!user) {
      return next({
        path: '/signin'
      })
    }
    return next();
  }
  return next();
})

export default router
