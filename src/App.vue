<template>
  <div id="app">
    <canvas id="canvas"></canvas>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

import * as xrender from '../xrender'

@Component({
  mounted () {
    let xr = xrender.init('#app')
    let circle = new xrender.Circle({
      shape: {
        cx: 40,
        cy: 40,
        r: 20
      }
    })
    let circle1 = new xrender.Circle({
      shape: {
        cx: 60,
        cy: 60,
        r: 20
      },
      style: {
        fill: '#00f'
      }
    })
    let circle2 = new xrender.Circle({
      shape: {
        cx: 100,
        cy: 100,
        r: 40
      },
      style: {
        fill: '#0ff',
        stroke: '#f00'
      }
    })
    xr.add(circle, circle1, circle2)
    let rect = new xrender.Rect({
      shape: {
        x: 120,
        y: 120,
        width: 40,
        height: 40
      },
      style: {
        fill: 'transparent'
      }
    })
    xr.add(rect)
  }
})
export default class App extends Vue {}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
