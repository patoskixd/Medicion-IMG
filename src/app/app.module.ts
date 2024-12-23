import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CalibrationFormComponent } from './image-preview/calibration-form/calibration-form.component';
import { ResultsComponent } from './image-preview/results/results.component';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MeasurementDialogComponent } from './image-preview/measurement-dialog/measurement-dialog.component';


@NgModule({
  declarations: [AppComponent, CalibrationFormComponent,ResultsComponent,MeasurementDialogComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, FormsModule, IonicModule, CommonModule ],
  
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], 
})
export class AppModule {}
