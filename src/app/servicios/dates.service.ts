import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VAUResponse } from '../interfaces/vau-response';

@Injectable({
  providedIn: 'root'
})
export class DatesService {

  private apiUrl = 'http://localhost:8081/api/conversiontovau';

  constructor(private http: HttpClient) {}

  getVAU(date: string): Observable<VAUResponse> {
    return this.http.get<VAUResponse>(`${this.apiUrl}?date=${date}`);
  }

}