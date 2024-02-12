import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component } from '@angular/core';
import { Chart } from 'chart.js';
import * as d3 from 'd3';
import { DataService } from '../data.service';

@Component({
  selector: 'pb-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements AfterViewInit {
  constructor(private http: HttpClient, private dataService: DataService) { }

  ngAfterViewInit(): void {
    if (this.dataService.dataSource.datasets[0].data.length === 0) {
      this.http.get('http://localhost:3000/budget')
        .subscribe((res: any) => {
          for (let i = 0; i < res.myBudget.length; i++) {
            this.dataService.dataSource.datasets[0].data[i] = res.myBudget[i].budget;
            this.dataService.dataSource.labels[i] = res.myBudget[i].title;
          }
          this.createChart();
        });
    } else {
      this.createChart();
    }
    
    this.d3Chart();
  }

  createChart() {
    var canvas =  <HTMLCanvasElement> document.getElementById('myChart');
    var ctx = canvas.getContext('2d');
    var myPieChart = new Chart(ctx, {
        type: 'pie',
        data: this.dataService.dataSource,
    });
  }

  d3Chart() {
    var svg = d3.select('#myChart2').append('g');

    svg.append('g').attr('class', 'slices');
    svg.append('g').attr('class', 'labels');
    svg.append('g').attr('class', 'lines');

    var width = 960,
      height = 450,
      radius = Math.min(width, height) / 2;

    var pie = d3.layout
      .pie()
      .sort(null)
      .value(function (d) {
        return d.value;
      });

    var arc = d3.svg
      .arc()
      .outerRadius(radius * 0.8)
      .innerRadius(radius * 0.4);

    var outerArc = d3.svg
      .arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);

    svg.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    var key = function (d) {
      return d.data.label;
    };

    if (this.dataService.dataSource.datasets[0].data.length === 0) {
      this.http.get('http://localhost:3000/budget').subscribe(function (res: any) {
        var color = d3.scale
          .ordinal()
          .domain(
            res.myBudget.map(function (d) {
              return d.title;
            })
          )
          .range([
            '#98abc5',
            '#8a89a6',
            '#7b6888',
            '#6b486b',
            '#a05d56',
            '#d0743c',
            '#ff8c00',
            '#e7e9ed',
          ]);

        var labels = color.domain();
        var data = labels.map(function (label) {
          return {
            label: label,
            value: res.myBudget.find((d) => d.title === label).budget,
          };
        });

        change(data, color);
      });
    } else {
      var color = d3.scale
        .ordinal()
        .domain(
          this.dataService.dataSource.labels.map(function (d) {
            return d;
          })
        )
        .range([
          '#98abc5',
          '#8a89a6',
          '#7b6888',
          '#6b486b',
          '#a05d56',
          '#d0743c',
          '#ff8c00',
          '#e7e9ed',
        ]);

      var labels = color.domain();
      var data = labels.map(function (label) {
        return {
          label: label,
          value: this.dataService.dataSource.datasets[0].data[
            this.dataService.dataSource.labels.indexOf(label)
          ],
        };
      });

      change(data, color);
    }

    function change(data, color) {
      /* ------- PIE SLICES -------*/
      var slice = svg
        .select('.slices')
        .selectAll('path.slice')
        .data(pie(data), key);

      slice
        .enter()
        .insert('path')
        .style('fill', function (d) {
          return color(d.data.label);
        })
        .attr('class', 'slice');

      slice
        .transition()
        .duration(1000)
        .attrTween('d', function (d) {
          this._current = this._current || d;
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(0);
          return function (t) {
            return arc(interpolate(t));
          };
        });

      slice.exit().remove();

      /* ------- TEXT LABELS -------*/

      var text = svg.select('.labels').selectAll('text').data(pie(data), key);

      text
        .enter()
        .append('text')
        .attr('dy', '.35em')
        .text(function (d) {
          return d.data.label;
        });

      function midAngle(d) {
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
      }

      text
        .transition()
        .duration(1000)
        .attrTween('transform', function (d) {
          this._current = this._current || d;
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(0);
          return function (t) {
            var d2 = interpolate(t);
            var pos = outerArc.centroid(d2);
            pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
          };
        })
        .styleTween('text-anchor', function (d) {
          this._current = this._current || d;
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(0);
          return function (t) {
            var d2 = interpolate(t);
            return midAngle(d2) < Math.PI ? 'start' : 'end';
          };
        });

      text.exit().remove();

      /* ------- SLICE TO TEXT POLYLINES -------*/

      var polyline = svg
        .select('.lines')
        .selectAll('polyline')
        .data(pie(data), key);

      polyline.enter().append('polyline');

      polyline
        .transition()
        .duration(1000)
        .attrTween('points', function (d) {
          this._current = this._current || d;
          var interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(0);
          return function (t) {
            var d2 = interpolate(t);
            var pos = outerArc.centroid(d2);
            pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
            return [arc.centroid(d2), outerArc.centroid(d2), pos];
          };
        });

      polyline.exit().remove();
    }
  }
}
