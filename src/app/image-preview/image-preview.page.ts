import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import Konva from 'konva';

@Component({
  selector: 'app-image-preview',
  templateUrl: './image-preview.page.html',
  styleUrls: ['./image-preview.page.scss'],
})
export class ImagePreviewPage {
  @ViewChild('konvaContainer', { static: true }) konvaContainer!: ElementRef;

  private stage!: Konva.Stage;
  private imageLayer!: Konva.Layer;
  private markerLayer!: Konva.Layer;
  private imageObj = new Image();
  private konvaImage!: Konva.Image;
  private markers: { marker1?: Konva.Circle; marker2?: Konva.Circle } = {};
  private line!: Konva.Line;
  private scaleFactor = 1; // Factor de escala para mantener la calidad

  ngOnInit() {
    const state = history.state;
    if (state.image) {
      this.imageObj.src = state.image;
      this.imageObj.onload = () => {
        this.initializeStage();
        this.addImageToStage();
      };
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeStage();
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
    this.resizeStage();
  }

  private resizeStage() {
    const container = this.konvaContainer.nativeElement;

    // Calcular el factor de escala
    const scaleX = container.offsetWidth / this.imageObj.width;
    const scaleY = container.offsetHeight / this.imageObj.height;
    this.scaleFactor = Math.min(scaleX, scaleY);

    // Calcular la posición para centrar la imagen
    const imageX = (container.offsetWidth - this.imageObj.width * this.scaleFactor) / 2;
    const imageY = (container.offsetHeight - this.imageObj.height * this.scaleFactor) / 2;

    if (this.konvaImage) {
      // Solo actualiza la escala y posición
      this.konvaImage.scale({ x: this.scaleFactor, y: this.scaleFactor });
      this.konvaImage.position({ x: imageX, y: imageY });
    } else {
      // Crea la imagen por primera vez
      this.konvaImage = new Konva.Image({
        image: this.imageObj,
        x: imageX,
        y: imageY,
        scaleX: this.scaleFactor,
        scaleY: this.scaleFactor,
      });
      this.imageLayer.add(this.konvaImage);
    }

    this.imageLayer.draw();
    this.updateMarkersAndLine();
  }

  private updateMarkersAndLine() {
    Object.values(this.markers).forEach((marker) => {
      if (marker) {
        // Transformar las coordenadas del marcador
        const relativePos = this.transformImageToMarkerCoords(marker.x(), marker.y());
        const updatedPos = this.transformMarkerToImageCoords(relativePos.x, relativePos.y);
        marker.position(updatedPos);
      }
    });

    if (this.line) {
      this.drawLine();
    }

    this.markerLayer.draw();
  }

  private transformImageToMarkerCoords(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - this.konvaImage.x()) / this.konvaImage.scaleX(),
      y: (y - this.konvaImage.y()) / this.konvaImage.scaleY(),
    };
  }

  private transformMarkerToImageCoords(x: number, y: number): { x: number; y: number } {
    return {
      x: x * this.konvaImage.scaleX() + this.konvaImage.x(),
      y: y * this.konvaImage.scaleY() + this.konvaImage.y(),
    };
  }

  setMarker(marker: 'marker1' | 'marker2') {
    this.stage.on('click touchstart', (e) => {
      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;

      // Convertir las coordenadas del clic al sistema de la imagen original
      const transform = this.konvaImage.getAbsoluteTransform().copy().invert();
      const imageCoords = transform.point(pointer);

      // Validar si el clic está dentro de los límites de la imagen
      if (
        imageCoords.x >= 0 &&
        imageCoords.y >= 0 &&
        imageCoords.x <= this.imageObj.width &&
        imageCoords.y <= this.imageObj.height
      ) {
        this.addMarker(imageCoords.x, imageCoords.y, marker === 'marker1' ? 'red' : 'blue', marker);
        console.log(`Marcador ${marker} colocado en: x=${imageCoords.x}, y=${imageCoords.y}`);
      } else {
        console.log('El clic está fuera de los límites de la imagen.');
      }

      this.stage.off('click touchstart');
    });
  }

  private addMarker(x: number, y: number, color: string, marker: 'marker1' | 'marker2') {
    if (this.markers[marker]) {
      this.markers[marker]!.destroy();
    }

    const markerPos = this.transformMarkerToImageCoords(x, y);

    const newMarker = new Konva.Circle({
      x: markerPos.x,
      y: markerPos.y,
      radius: 5,
      fill: color,
    });

    this.markerLayer.add(newMarker);
    this.markerLayer.draw();

    this.markers[marker] = newMarker;

    if (this.markers.marker1 && this.markers.marker2) {
      this.drawLine();
      this.calculateDistance();
    }
  }

  private drawLine() {
    if (this.line) {
      this.line.destroy();
    }

    const points = [
      this.markers.marker1!.x(),
      this.markers.marker1!.y(),
      this.markers.marker2!.x(),
      this.markers.marker2!.y(),
    ];

    this.line = new Konva.Line({
      points,
      stroke: 'green',
      strokeWidth: 2,
      lineJoin: 'round',
    });

    this.markerLayer.add(this.line);
    this.markerLayer.draw();
  }

  private calculateDistance() {
    const marker1 = this.markers.marker1!;
    const marker2 = this.markers.marker2!;

    const dx = (marker2.x() - marker1.x()) / this.konvaImage.scaleX();
    const dy = (marker2.y() - marker1.y()) / this.konvaImage.scaleY();
    const distance = Math.sqrt(dx * dx + dy * dy);

    console.log(`Distancia en píxeles: ${distance}`);
  }
}