<template>
    <div class="grid" id="application-grid">
        <div class="container-fluid dashboard grid-body-scroll">
            <div class="row">
                <div class="col-xs-6 col-sm-3">
                    <div class="panel panel-primary">
                        <div class="panel-body">
                            <br/><br/><br/><br/><div v-html="getCellValue()"></div>
                        </div>
                    </div>
                </div>
                <div class="col-xs-6 col-sm-3">
                    <div class="panel panel-success">
                        <div class="panel-body">
                            <br/><br/><br/><br/>
                        </div>
                    </div>
                </div>

                <div class="col-xs-6 col-sm-3">
                    <div class="panel panel-danger">
                        <div class="panel-body">
                            <br/><br/><br/><br/>
                        </div>
                    </div>
                </div>

                <div class="col-xs-6 col-sm-3">
                    <div class="panel panel-warning">
                        <div class="panel-body">
                            <br/><br/><br/><br/>
                        </div>
                    </div>
                </div>

                <div class="col-xs-12 col-sm-9">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            Something
                        </div>
                        <div class="panel-body">

                            <FullCalendar :options="calendarOptions" />

                        </div>
                    </div>
                </div>

                <div class="col-xs-12 col-sm-3">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                          NetSofters
                        </div>
                        <div class="panel-body">
                          Hello World
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>

import '@fullcalendar/core/vdom' // solves problem with Vite
import FullCalendar from '@fullcalendar/vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

export default {
  components: {
    FullCalendar // make the <FullCalendar> tag available
  },
  mounted () {
    this.$store.dispatch( 'list/dashboard' ).then(response => {
      // this.$store.dispatch( 'showError', '#');
      console.log("Response ");
      console.log(response);
    }).catch( error => {
      console.log(error);
    });
  },
  data() {
    return {
      calendarOptions: {
        plugins: [ dayGridPlugin, interactionPlugin ],
        initialView: 'dayGridMonth'
      }
    }
  },
  methods: {
    getCellValue(){
      console.log('ok');
    }
  }
}
</script>
