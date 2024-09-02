export default {
  ssr: false,

  target: 'static',

  head: {
    title: 'الأحياء غير الرسمية',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/images/logo.png' },
      {
        rel: "stylesheet",
        href: "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css",
      },
    ],
  },

  env: {
    // mapboxAccessToken:
    // 'pk.eyJ1IjoiaGFuaWF6YWF0YXJpIiwiYSI6IkgweGc4aGcifQ.a94yjoaoadTAaBGz62lpDQ',
    mapboxAccessToken:
      'pk.eyJ1IjoibWFwc3B1YmxpY3dvcmtzIiwiYSI6ImNsc2JybGswbzA0N3Ayam8xcHY0ZXl2c2sifQ.KPXn2ULvL9FW6DH-6H9fyA',
    MapboxStyle: 'mapbox://styles/mapspublicworks/clyoshdxe002n01ph33z2e8ld',
    // MapboxStyle1: 'mapbox://styles/mapspublicworks/clxjj5bb800bq01qnc80w3t3w',
  },

  css: [],

  plugins: [],

  components: true,

  buildModules: [],

  modules: ['@nuxtjs/axios'],

  axios: {},

  build: {},
}
