<template>
  <div id="app">
    <canvas id="canvas" width="300" height="300"></canvas>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

import * as xrender from '../xrender'

@Component({
  mounted () {
    let xr = xrender.init('#app', {
      height: 300,
      width: 400
    })
    let circle = new xrender.Circle({
      shape: {
        cx: 40,
        cy: 40,
        r: 20
      },
      style: {
        fill: '#000'
      },
      zLevel: 2
    })
    let circle1 = new xrender.Circle({
      shape: {
        cx: 60,
        cy: 60,
        r: 20
      },
      style: {
        stroke: '#f00',
        lineWidth: 1
      }
    })
    let circle2 = new xrender.Circle({
      shape: {
        cx: 150,
        cy: 150,
        r: 40
      },
      style: {
        stroke: '#f00',
        opacity: 0.5
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
    window.circle = circle
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
#canvas {
  width: 300px;
  height: 300px;
}
</style>
