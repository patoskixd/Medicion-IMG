import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import Konva from 'konva';
import { ModalController } from '@ionic/angular';
import { CalibrationFormComponent } from './calibration-form/calibration-form.component';

import { ToastController } from '@ionic/angular';


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
  private isLocked: boolean = false; // Indica si el zoom y el movimiento están bloqueados
  public imageSize: { width: number; height: number } = { width: 0, height: 0 };
  public measuredDistance: number | null = null;
  public calibrationDialogVisible = false; // Controla si la pestaña de calibración está visible
  public knownDistance: number | null = null; // Distancia conocida ingresada por el usuario
  public unitOfMeasurement: string = ''; // Unidad de medida seleccionada
  public scale: number | null = null; // Escala calculada
  public useMagnification = false; // Controla si se usa selección de ampliación
  public magnificationOptions = [4, 10, 40, 100]; // Opciones de ampliación
  public selectedMagnification: number | null = null; // Ampliación seleccionada
  public unitsPerPixel: number | null = null; // Factor de conversión entre píxeles y unidades reales
  


  constructor(private toastController: ToastController, private modalController: ModalController) {}

  async openCalibrationDialog() {
    if (this.markers.marker1 && this.markers.marker2) {
      let convertedDistance: number | null = null;
  
      // Calcular la distancia conocida si la calibración ya está configurada
      if (this.unitsPerPixel && this.measuredDistance) {
        convertedDistance = this.measuredDistance * this.unitsPerPixel;
      }
  
      const modal = await this.modalController.create({
        component: CalibrationFormComponent,
        componentProps: {
          measuredDistance: this.measuredDistance,
          knownDistance: convertedDistance, // Pasar la distancia conocida convertida
          unitOfMeasurement: this.unitOfMeasurement, // Pasar la unidad guardada
        },
      });
  
      modal.onDidDismiss().then((result) => {
        if (result.data) {
          const { scale, unit } = result.data;
  
          // Guardar escala y unidad
          this.unitsPerPixel = scale;
          this.unitOfMeasurement = unit;
  
          // Almacenar en localStorage
          if (this.unitsPerPixel !== null) {
            localStorage.setItem('unitsPerPixel', this.unitsPerPixel.toString());
          }
          if (this.unitOfMeasurement) {
            localStorage.setItem('unitOfMeasurement', this.unitOfMeasurement);
          }
  
          console.log(`Escala guardada: ${this.unitsPerPixel} ${this.unitOfMeasurement}/píxel.`);
        }
      });
  
      await modal.present();
    } else {
      this.showToast('Por favor, coloque dos marcadores antes de calibrar.');
    }
  }
  
  
  saveCalibration() {
    if (this.useMagnification && this.selectedMagnification) {
      // Usar la magnificación seleccionada
      this.unitsPerPixel = this.selectedMagnification / this.measuredDistance!;
      this.unitOfMeasurement = 'µm'; // Unidad típica para microscopios
    } else if (this.knownDistance && this.unitOfMeasurement) {
      // Usar la distancia y unidad de medida ingresadas
      this.unitsPerPixel = this.knownDistance / this.measuredDistance!;
    } else {
      this.showToast('Complete todos los campos antes de guardar la calibración.');
      return;
    }
  
    // Guardar los valores en localStorage
    if (this.unitsPerPixel && this.unitOfMeasurement) {
      localStorage.setItem('unitsPerPixel', this.unitsPerPixel.toString());
      localStorage.setItem('unitOfMeasurement', this.unitOfMeasurement);
      console.log(`Calibración guardada: ${this.unitsPerPixel} ${this.unitOfMeasurement}/píxel.`);
    } else {
      console.log('No se pudo guardar la calibración. Valores inválidos.');
    }
  
    this.calibrationDialogVisible = false; // Cerrar el diálogo
  }
  
  
  


  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000, // Duración en milisegundos
      position: 'top', // Posición: 'top', 'middle', o 'bottom'
      color: 'danger', // Color de la notificación
    });
  
    await toast.present();
  }
  
  ngOnInit() {
    // Eliminar cualquier escala almacenada previamente
    localStorage.removeItem('unitsPerPixel');
    localStorage.removeItem('unitOfMeasurement');
  
    // Reiniciar variables relacionadas con la calibración
    this.unitsPerPixel = null;
    this.unitOfMeasurement = 'µm';
    this.knownDistance = null;
  
    console.log('Calibración eliminada. Debes realizar una nueva escala.');
  
    // Cargar la imagen desde el estado del historial
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
//Configuracion de la imagenes
  private addImageToStage() {
    const container = this.konvaContainer.nativeElement;
    const scaleX = container.offsetWidth / this.imageObj.width;
    const scaleY = container.offsetHeight / this.imageObj.height;
    this.scaleFactor = Math.min(scaleX, scaleY);
  
    this.imageSize = { width: this.imageObj.width, height: this.imageObj.height }; // Asignar tamaño de la imagen

    const imageX = (container.offsetWidth - this.imageObj.width * this.scaleFactor) / 2;
    const imageY = (container.offsetHeight - this.imageObj.height * this.scaleFactor) / 2;
  
    if (!this.konvaImage) {
      this.konvaImage = new Konva.Image({
        image: this.imageObj,
        x: imageX,
        y: imageY,
        scaleX: this.scaleFactor,
        scaleY: this.scaleFactor,
        draggable: false // Permitir mover la imagen
      });
      this.imageLayer.add(this.konvaImage);
    }
  
    this.konvaImage.scale({ x: this.scaleFactor, y: this.scaleFactor });
    this.konvaImage.position({ x: imageX, y: imageY });
    this.imageLayer.draw();
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
    this.isLocked = true;
    this.konvaImage.draggable(false);
    this.stage.on('click touchstart', async (e) => {
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
        await this.showToast('El marcador está fuera de los límites de la imagen.'); // Notificacion para q se ponga vio
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
// Calcula la distancia en px
private calculateDistance() {
  const marker1 = this.markers.marker1!;
  const marker2 = this.markers.marker2!;

  const dx = (marker2.x() - marker1.x()) / this.konvaImage.scaleX();
  const dy = (marker2.y() - marker1.y()) / this.konvaImage.scaleY();
  const distanceInPixels = Math.sqrt(dx * dx + dy * dy);

  this.measuredDistance = distanceInPixels; // Almacenar distancia en píxeles

  if (this.unitsPerPixel !==null) {
    const distanceInUnits = distanceInPixels * this.unitsPerPixel;
    console.log(`Distancia medida: ${distanceInPixels.toFixed(2)} píxeles.`);
    console.log(`Distancia convertida: ${distanceInUnits.toFixed(2)} ${this.unitOfMeasurement}.`);
  } else {
    console.log(`Distancia medida: ${distanceInPixels.toFixed(2)} píxeles.`);
    console.log(`Calibración no establecida.`);
  }
}


  //Botones de zoom
  async zoomIn() {
    if (this.isLocked) {
      console.log('Zoom bloqueado.');
      await this.showToast('Zoom bloqueado, restablecer marcadores para aplicarlo.'); // Notificacion para q se ponga vio
      return;
    }
    
    const scaleBy = 1.2; // Factor de aumento
    const oldScale = this.konvaImage.scaleX();
    const newScale = oldScale * scaleBy;
    this.konvaImage.draggable(newScale > 1);
  
    this.konvaImage.scale({ x: newScale, y: newScale });
    this.centerImageOnZoom(newScale, oldScale);
    this.konvaImage.draggable(true);
  }
  
  async zoomOut() {
    if (this.isLocked) {
      console.log('Zoom bloqueado.');
      await this.showToast('Zoom bloqueado, restablecer marcadores para aplicarlo.'); // Notificacion para q se ponga vio
      return;
    }
    const scaleBy = 0.8; // Factor de reducción
    const oldScale = this.konvaImage.scaleX();
    const newScale = oldScale * scaleBy;
  
    this.konvaImage.scale({ x: newScale, y: newScale });
    this.centerImageOnZoom(newScale, oldScale);
    this.konvaImage.draggable(true);
  }
  
  private centerImageOnZoom(newScale: number, oldScale: number) {
    const container = this.konvaContainer.nativeElement;
    const stageWidth = container.offsetWidth;
    const stageHeight = container.offsetHeight;
  
    const imageWidth = this.imageObj.width * newScale;
    const imageHeight = this.imageObj.height * newScale;
  
    // Ajustar posición para centrar la imagen
    const newPosX = Math.max(
      Math.min(this.konvaImage.x(), (stageWidth - imageWidth) / 2),
      0
    );
    const newPosY = Math.max(
      Math.min(this.konvaImage.y(), (stageHeight - imageHeight) / 2),
      0
    );
  
    this.konvaImage.position({ x: newPosX, y: newPosY });
    this.imageLayer.draw();
  }

  //Reset de los marcadores
  resetMarkers() {

    // Eliminar marcadores existentes
    Object.values(this.markers).forEach((marker) => {
      if (marker) {
        marker.destroy();
      }
    });
  
    // Eliminar la línea si existe
    if (this.line) {
      this.line.destroy(); // Asignar null en lugar de undefined
    }
  
    // Limpiar referencias
    this.markers = {};

    // Habilitar zoom y movimiento
    this.isLocked = false; // Desbloquear controles
    this.konvaImage.draggable(false); // Permitir mover la imagen
  
    // Redibujar la capa
    this.markerLayer.draw();
    console.log('Marcadores restablecidos.');
  }
  
  
  
  
}
