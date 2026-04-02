import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VAUResponse } from '../interfaces/vau-response';
import { CalendarByYearDTO } from '../interfaces/calendar-by-year-dto';


@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  private apiUrl = 'http://localhost:8081/api/';

  constructor(private http: HttpClient) {}

  getPDF(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}getpdf`, {
      responseType: 'blob'
    });
  }

  getCalendarForAYear(dto: CalendarByYearDTO): Observable<Blob> {
    return this.http.post(`${this.apiUrl}getcalendar`, dto, {
      responseType: 'blob'
    });
  }

}
