import { Component, Input, ElementRef, ViewChild, OnInit } from '@angular/core';
import Konva from 'konva';
import { ModalController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-measurement-dialog',
  templateUrl: './measurement-dialog.component.html',
  styleUrls: ['./measurement-dialog.component.scss'],
})
export class MeasurementDialogComponent implements OnInit {
  @Input() image: string = ''; // Ruta de la imagen
  @Input() marker1!: { x: number; y: number }; // Coordenadas del marcador 1
  @Input() marker2!: { x: number; y: number }; // Coordenadas del marcador 2
  @Input() distance!: number; // Distancia calculada
  @Input() unitOfMeasurement: string = ''; // Unidad de medida
  @Input() tramo!: number; // Número de medición
  @Input() label?: string; // Etiqueta opcional

  @ViewChild('konvaContainer', { static: true })
  konvaContainer!: ElementRef<HTMLDivElement>;

  private stage!: Konva.Stage;
  private imageLayer!: Konva.Layer;
  private markerLayer!: Konva.Layer;
  private imageObj = new Image();
  private konvaImage!: Konva.Image;
  private line!: Konva.Line;

  private scaleFactor = 1; // Factor de escala para ajustar la imagen al contenedor

  // Desplazamiento para centrar la imagen y los marcadores
  private offsetX = 0;
  private offsetY = 0;

  constructor(
    private modalController: ModalController,
    private loadingController: LoadingController
  ) {}

  async ngOnInit() {
    const loading = await this.loadingController.create({
      message: 'Cargando imagen...',
    });
    await loading.present();

    this.imageObj.src = this.image;
    this.imageObj.onload = async () => {
      this.initializeStage();
      this.addImageToStage();
      this.addMarkersAndLine();
      await loading.dismiss();
    };

    this.imageObj.onerror = async () => {
      await loading.dismiss();
      console.error('Error al cargar la imagen.');
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

    // Calculamos factores de escala en ancho y alto
    const scaleX = container.offsetWidth / this.imageObj.width;
    const scaleY = container.offsetHeight / this.imageObj.height;

    // Tomamos el factor mínimo para no deformar la imagen
    this.scaleFactor = Math.min(scaleX, scaleY);

    // IMPORTANTE: calcular offset para centrar la imagen escalada
    const scaledWidth = this.imageObj.width * this.scaleFactor;
    const scaledHeight = this.imageObj.height * this.scaleFactor;
    this.offsetX = (container.offsetWidth - scaledWidth) / 2;
    this.offsetY = (container.offsetHeight - scaledHeight) / 2;

    // Creamos el Konva.Image en la posición centrada
    this.konvaImage = new Konva.Image({
      image: this.imageObj,
      x: this.offsetX,
      y: this.offsetY,
      scaleX: this.scaleFactor,
      scaleY: this.scaleFactor,
    });

    this.imageLayer.add(this.konvaImage);
    this.imageLayer.draw();
  }

  private addMarkersAndLine() {
    // Al dibujar marcadores, aplicamos el mismo offset para centrar.
    if (this.marker1) {
      this.addMarker(
        this.offsetX + this.marker1.x * this.scaleFactor,
        this.offsetY + this.marker1.y * this.scaleFactor,
        'red'
      );
    }
    if (this.marker2) {
      this.addMarker(
        this.offsetX + this.marker2.x * this.scaleFactor,
        this.offsetY + this.marker2.y * this.scaleFactor,
        'blue'
      );
    }

    if (this.marker1 && this.marker2) {
      this.drawAndAnimateLine(
        this.offsetX + this.marker1.x * this.scaleFactor,
        this.offsetY + this.marker1.y * this.scaleFactor,
        this.offsetX + this.marker2.x * this.scaleFactor,
        this.offsetY + this.marker2.y * this.scaleFactor
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
      stroke: '#2196F3',
      strokeWidth: 3,
      lineCap: 'round',
      dash: [10, 5],
      shadowColor: 'black',
      shadowBlur: 2,
      shadowOffset: { x: 1, y: 1 },
      shadowOpacity: 0.3,
    });

    this.markerLayer.add(this.line);

    const animation = new Konva.Animation((frame) => {
      if (!frame) return;
      const dashOffset = -frame.time / 50;
      this.line.dashOffset(dashOffset);
    }, this.markerLayer);

    animation.start();
  }

  dismiss() {
    this.modalController.dismiss();
  }
}
