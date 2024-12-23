import { Component, Input, ElementRef, ViewChild, OnInit } from '@angular/core';
import Konva from 'konva';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-measurement-dialog',
  templateUrl: './measurement-dialog.component.html',
  styleUrls: ['./measurement-dialog.component.scss']
})
export class MeasurementDialogComponent implements OnInit {
  @Input() image: string = ''; // Ruta de la imagen
  @Input() marker1!: { x: number; y: number }; // Coordenadas del marcador 1
  @Input() marker2!: { x: number; y: number }; // Coordenadas del marcador 2

  @ViewChild('konvaContainer', { static: true }) konvaContainer!: ElementRef<HTMLDivElement>;

  private stage!: Konva.Stage;
  private imageLayer!: Konva.Layer;
  private markerLayer!: Konva.Layer;
  private imageObj = new Image();
  private konvaImage!: Konva.Image;
  private line!: Konva.Line;

  private scaleFactor = 1; // Factor de escala para ajustar la imagen al contenedor

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    console.log('Ruta de la imagen:', this.image);

    // Configuración inicial para cargar la imagen
    this.imageObj.src = this.image;
    this.imageObj.onload = () => {
      this.initializeStage();
      this.addImageToStage();
      this.addMarkersAndLine();
    };
  }

  private initializeStage() {
    const container = this.konvaContainer.nativeElement;

    this.stage = new Konva.Stage({
      container,
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    this.imageLayer = new Konva.Layer();
    this.markerLayer = new Konva.Layer();

    this.stage.add(this.imageLayer);
    this.stage.add(this.markerLayer);
  }

  private addImageToStage() {
    const container = this.konvaContainer.nativeElement;

    const scaleX = container.offsetWidth / this.imageObj.width;
    const scaleY = container.offsetHeight / this.imageObj.height;

    this.scaleFactor = Math.min(scaleX, scaleY);

    this.konvaImage = new Konva.Image({
      image: this.imageObj,
      x: 0,
      y: 0,
      scaleX: this.scaleFactor,
      scaleY: this.scaleFactor,
    });

    this.imageLayer.add(this.konvaImage);
    this.imageLayer.draw();
  }

  private addMarkersAndLine() {
    // Agregar los marcadores
    if (this.marker1) {
      this.addMarker(this.marker1.x * this.scaleFactor, this.marker1.y * this.scaleFactor, 'red');
    }
    if (this.marker2) {
      this.addMarker(this.marker2.x * this.scaleFactor, this.marker2.y * this.scaleFactor, 'blue');
    }

    // Dibujar y animar la línea entre los marcadores
    if (this.marker1 && this.marker2) {
      this.drawAndAnimateLine(
        this.marker1.x * this.scaleFactor,
        this.marker1.y * this.scaleFactor,
        this.marker2.x * this.scaleFactor,
        this.marker2.y * this.scaleFactor
      );
    }

    this.markerLayer.draw();
  }

  private addMarker(x: number, y: number, color: string) {
    const marker = new Konva.Circle({
      x,
      y,
      radius: 10,
      fill: color,
      stroke: 'white',
      strokeWidth: 2,
    });

    this.markerLayer.add(marker);
  }

  private drawAndAnimateLine(x1: number, y1: number, x2: number, y2: number) {
    this.line = new Konva.Line({
      points: [x1, y1, x2, y2],
      stroke: '#2196F3', // Color de la línea
      strokeWidth: 3,
      lineCap: 'round',
      dash: [10, 5], // Línea discontinua
      shadowColor: 'black',
      shadowBlur: 2,
      shadowOffset: { x: 1, y: 1 },
      shadowOpacity: 0.3,
    });

    this.markerLayer.add(this.line);

    // Crear animación para la línea
    const animation = new Konva.Animation((frame) => {
      if (!frame) return;
      const dashOffset = -frame.time / 50;
      this.line.dashOffset(dashOffset);
    }, this.markerLayer);

    animation.start();
  }

  dismiss() {
    this.modalController.dismiss(); // Cierra el modal
  }
}
