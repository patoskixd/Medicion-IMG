import { Component, ElementRef, ViewChild, HostListener,OnInit } from '@angular/core';
import Konva from 'konva';
import { ModalController } from '@ionic/angular';
import { CalibrationFormComponent } from './calibration-form/calibration-form.component';
import { ResultsComponent } from './results/results.component';
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
  private markers: { marker1?: Konva.Group; marker2?: Konva.Group } = {};
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
  private savedScale: number = 1; // Escala guardada
  private savedPosition: { x: number; y: number } = { x: 0, y: 0 };
  public history: { tramo: number; distancia: number ; marker1:{x:number; y:number}; marker2: {x:number; y:number},image: string; }[] = []; // Lista de tramos calculados
  private tramoCounter = 1; 


  constructor(private toastController: ToastController, private modalController: ModalController) {}


  ngOnInit() {
    this.resetHistory();
    this.loadImageFromState();
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
  private loadImageFromState() {
    const state = history.state;
    if (state.image) {
      this.updateImage(state.image);
    }
  }
  private updateImage(imageSrc: string) {
    this.imageObj.src = imageSrc;
    this.imageObj.onload = () => {
      if (!this.stage) {
        this.initializeStage();
      }
      this.addImageToStage();
    };
  }
  
  private resetHistory() {
    this.history = [];
    this.tramoCounter = 1;
  }
  async openCalibrationDialog() {
    if (this.markers.marker1 && this.markers.marker2) {
      let convertedDistance: number | null = null;
  
      // Calcular la distancia conocida si la calibración ya está configurada
      if (this.unitsPerPixel && this.measuredDistance) {
        convertedDistance = this.measuredDistance * this.unitsPerPixel;
      }
      this.savedScale = this.konvaImage.scaleX();
      this.savedPosition = this.konvaImage.position();
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
        this.restoreImageState();
      });
  
      await modal.present();
    } else {
      this.showAlert('Por favor, coloque los puntos antes de calibrar.');
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
      this.showAlert('Complete todos los campos antes de guardar la calibración.');
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
  
  

  private async showAlert(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000, // Duración en milisegundos
      position: 'top', // Posición: 'top', 'middle', o 'bottom'
      color: 'danger', // Color de la notificación
    });
  
    await toast.present();
  }
  private async showGreenAlert(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000, // Duración en milisegundos
      position: 'top', // Posición: 'top', 'middle', o 'bottom'
      cssClass: 'my-custom-toast', // Color de la notificación
    });
  
    await toast.present();
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

  const imageWidth = this.imageObj.width * this.scaleFactor;
  const imageHeight = this.imageObj.height * this.scaleFactor;

  // Actualizar las dimensiones de la imagen en la UI
  this.imageSize = {
    width: Math.round(this.imageObj.width),
    height: Math.round(this.imageObj.height),
  };

  container.style.width = `${imageWidth}px`;
  container.style.height = `${imageHeight}px`;

  if (!this.konvaImage) {
    this.konvaImage = new Konva.Image({
      image: this.imageObj,
      x: 0,
      y: 0,
      scaleX: this.scaleFactor,
      scaleY: this.scaleFactor,
      draggable: true,
    });

    this.imageLayer.add(this.konvaImage);
    this.addDragMoveListener(); // Restringir los límites
  }

  this.konvaImage.scale({ x: this.scaleFactor, y: this.scaleFactor });
  this.konvaImage.position({ x: 0, y: 0 });
  this.imageLayer.draw();
  this.resizeStage();
}
private restoreImageState() {
  // Restaurar el nivel de zoom
  this.konvaImage.scale({ x: this.savedScale, y: this.savedScale });

  // Restaurar la posición
  this.konvaImage.position(this.savedPosition);

  // Redibujar la capa para reflejar los cambios
  this.imageLayer.draw();
}

private resizeStage() {
  const container = this.konvaContainer.nativeElement;

  const scaleX = container.offsetWidth / this.imageObj.width;
  const scaleY = container.offsetHeight / this.imageObj.height;

  this.scaleFactor = Math.min(scaleX, scaleY);

  const imageWidth = this.imageObj.width * this.scaleFactor;
  const imageHeight = this.imageObj.height * this.scaleFactor;

  this.imageSize = {
    width: Math.round(this.imageObj.width),
    height: Math.round(this.imageObj.height),
  };

  container.style.width = `${imageWidth}px`;
  container.style.height = `${imageHeight}px`;

  this.stage.width(imageWidth);
  this.stage.height(imageHeight);

  if (this.konvaImage) {
    this.konvaImage.scale({ x: this.scaleFactor, y: this.scaleFactor });
    this.konvaImage.position({ x: 0, y: 0 });
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
      }

      this.stage.off('click touchstart');
    });
  }
  

  private addMarker(x: number, y: number, color: string, marker: 'marker1' | 'marker2') {
    if (this.markers[marker]) {
      this.markers[marker]!.destroy();
    }

    const markerPos = this.transformMarkerToImageCoords(x, y);

    // Create a group for the marker
    const newMarker = new Konva.Group({
      x: markerPos.x,
      y: markerPos.y,
    });

    // Main circle
    const circle = new Konva.Circle({
      radius: 10,
      fill: color,
      stroke: 'white',
      strokeWidth: 2,
      shadowColor: 'black',
      shadowBlur: 5,
      shadowOffset: { x: 1, y: 1 },
      shadowOpacity: 0.3,
    });

    // Inner dot
    const innerDot = new Konva.Circle({
      radius: 3,
      fill: 'white',
    });

    // Pulse animation
    const pulseAnimation = new Konva.Animation((frame) => {
      if (!frame) return;
      const scale = 1 + Math.sin(frame.time * 0.005) * 0.1;
      circle.scale({ x: scale, y: scale });
    }, this.markerLayer);

    newMarker.add(circle, innerDot);

    this.markerLayer.add(newMarker);
    this.markerLayer.draw();

    pulseAnimation.start();

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

    // Create line group
    const lineGroup = new Konva.Group();

    // Main line
    this.line = new Konva.Line({
      points,
      stroke: '#2196F3', // Material Design blue
      strokeWidth: 3,
      lineCap: 'round',
      dash: [10, 5],
      shadowColor: 'black',
      shadowBlur: 2,
      shadowOffset: { x: 1, y: 1 },
      shadowOpacity: 0.3,
    });

    // Dash animation
    const dashAnimation = new Konva.Animation((frame) => {
      if (!frame) return;
      const dashOffset = -frame.time / 50;
      this.line!.dashOffset(dashOffset);
    }, this.markerLayer);

    lineGroup.add(this.line);
    this.markerLayer.add(lineGroup);
    this.markerLayer.draw();

    dashAnimation.start();
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

async openResultsDialog() {
  // Verifica si el historial está vacío
  if (this.history.length === 0) {
    await this.showAlert('No hay valores en el historial.'); // Mostrar un mensaje de advertencia
    return;
  }

  const modal = await this.modalController.create({
    component: ResultsComponent,
    componentProps: {
      history: this.history, // Pasar el historial al modal
      unitOfMeasurement: this.unitOfMeasurement, // Pasar la unidad
    },
  });

  modal.onDidDismiss().then((result) => {
    if (result.data) {
      this.history = result.data.updatedHistory || [];
      this.tramoCounter = this.history.length > 0 
        ? Math.max(...this.history.map((item) => item.tramo)) + 1 
        : 1; // Ajustar el contador para nuevos tramos
    }
  });

  await modal.present();
}

  //Botones de zoom
  async zoomIn() {
    if (this.isLocked) {
      console.log('Zoom bloqueado.');
      await this.showAlert('Zoom bloqueado, restablecer los puntos para aplicarlo.');
      return;
    }
  
    const scaleBy = 1.2; // Factor de aumento
    const oldScale = this.konvaImage.scaleX();
    const newScale = oldScale * scaleBy;
  
    this.konvaImage.scale({ x: newScale, y: newScale });
    this.centerImageOnZoom(newScale, oldScale);
    this.konvaImage.draggable(true);
  }
  
  async zoomOut() {
    if (this.isLocked) {
      console.log('Zoom bloqueado.');
      await this.showAlert('Zoom bloqueado, restablecer los puntos para aplicarlo.');
      return;
    }
  
    const scaleBy = 0.8; // Factor de reducción
    const oldScale = this.konvaImage.scaleX();
    const newScale = oldScale * scaleBy;
  
    // Límite mínimo de escala: igual a la escala inicial
    const minScale = this.scaleFactor; // `this.scaleFactor` es la escala inicial calculada
  
    // Asegúrate de que el nuevo zoom no sea menor que el límite mínimo
    if (newScale < minScale) {
      console.log('Zoom out alcanzó el tamaño original.');
      this.konvaImage.scale({ x: minScale, y: minScale });
      this.centerImageOnZoom(minScale, oldScale);
      await this.showAlert('No se puede reducir más la imagen.');
      return;
    }
  
    this.konvaImage.scale({ x: newScale, y: newScale });
    this.centerImageOnZoom(newScale, oldScale);
    this.konvaImage.draggable(true);
  }
  
  
  
  private centerImageOnZoom(newScale: number, oldScale: number) {
    const container = this.konvaContainer.nativeElement;
  
    // Obtener el centro del contenedor
    const stageWidth = container.offsetWidth;
    const stageHeight = container.offsetHeight;
  
    // Obtener el centro visible actual de la imagen
    const currentCenterX = stageWidth / 2 - this.konvaImage.x();
    const currentCenterY = stageHeight / 2 - this.konvaImage.y();
  
    // Escalar el centro visible actual
    const scaledCenterX = currentCenterX * (newScale / oldScale);
    const scaledCenterY = currentCenterY * (newScale / oldScale);
  
    // Calcular la nueva posición para centrar la imagen
    const newPosX = stageWidth / 2 - scaledCenterX;
    const newPosY = stageHeight / 2 - scaledCenterY;
  
    // Limitar el movimiento para que la imagen no se salga del contenedor
    const imageWidth = this.imageObj.width * newScale;
    const imageHeight = this.imageObj.height * newScale;
  
    const minX = Math.min(0, stageWidth - imageWidth);
    const maxX = 0;
    const limitedX = Math.max(minX, Math.min(newPosX, maxX));
  
    const minY = Math.min(0, stageHeight - imageHeight);
    const maxY = 0;
    const limitedY = Math.max(minY, Math.min(newPosY, maxY));
  
    this.konvaImage.position({ x: limitedX, y: limitedY });
    this.imageLayer.draw();
  }
  
  
  private enforceImageBounds() {
    const container = this.konvaContainer.nativeElement;
  
    const imageWidth = this.imageObj.width * this.konvaImage.scaleX();
    const imageHeight = this.imageObj.height * this.konvaImage.scaleY();
  
    const minX = Math.min(0, container.offsetWidth - imageWidth);
    const maxX = 0;
  
    const minY = Math.min(0, container.offsetHeight - imageHeight);
    const maxY = 0;
  
    const newX = Math.max(minX, Math.min(this.konvaImage.x(), maxX));
    const newY = Math.max(minY, Math.min(this.konvaImage.y(), maxY));
  
    this.konvaImage.position({ x: newX, y: newY });
    this.imageLayer.draw();
  }
  
  private addDragMoveListener() {
    this.konvaImage.on('dragmove', () => {
      this.enforceImageBounds();
    });
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
    this.konvaImage.draggable(true); // Permitir mover la imagen
  
    // Redibujar la capa
    this.markerLayer.draw();

  }
  async saveMeasurement() {
    if (this.markers.marker1 && this.markers.marker2 && this.measuredDistance !== null && this.unitsPerPixel !== null) {
      const distance = (this.measuredDistance * this.unitsPerPixel).toFixed(2);
  
      const marker1Pos = {
        x: this.markers.marker1!.x() / this.konvaImage.scaleX(),
        y: this.markers.marker1!.y() / this.konvaImage.scaleY(),
      };
  
      const marker2Pos = {
        x: this.markers.marker2!.x() / this.konvaImage.scaleX(),
        y: this.markers.marker2!.y() / this.konvaImage.scaleY(),
      };
  
      // Guardar en el historial
      this.history.push({
        tramo: this.tramoCounter++,
        distancia: +distance,
        marker1: marker1Pos,
        marker2: marker2Pos,
        image:this.imageObj.src,
      });
  
      this.showGreenAlert(`Medición guardada. Distancia: ${distance} ${this.unitOfMeasurement}`);
    } else {
      this.showAlert('Por favor, complete la calibración y marque los puntos antes de guardar.');
    }
  }
  
  isCalibrated(): boolean {
    return this.unitsPerPixel !== null;
  }

  
  
  
  
  
}
