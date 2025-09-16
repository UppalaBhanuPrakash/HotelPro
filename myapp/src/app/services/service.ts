import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceRequest } from '../models/interfaces';
import { switchMap, take } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class Service {
   private apiUrl = 'http://localhost:3000/serviceRequests';

  constructor(private http: HttpClient) {}

  getServiceRequests(): Observable<ServiceRequest[]> {
    return this.http.get<ServiceRequest[]>(this.apiUrl);
  }

  getServiceRequestById(id: string): Observable<ServiceRequest> {
    return this.http.get<ServiceRequest>(`${this.apiUrl}/${id}`);
  }
addServiceRequest(request: Omit<ServiceRequest, 'id' | 'requestedAt'>): Observable<ServiceRequest> {
  return this.getServiceRequests().pipe(
    take(1), // take the first value and complete
    switchMap(existingRequests => {
      const maxId = existingRequests.length > 0
        ? Math.max(...existingRequests.map(r => +r.id))
        : 0;

      const newRequest: ServiceRequest = {
        ...request,
        id: (maxId + 1).toString(),
        requestedAt: new Date()
      };

      return this.http.post<ServiceRequest>(this.apiUrl, newRequest);
    })
  );
}

  updateServiceRequest(requestId: string, updates: Partial<ServiceRequest>): Observable<ServiceRequest> {
    return this.http.patch<ServiceRequest>(`${this.apiUrl}/${requestId}`, updates);
  }

  deleteServiceRequest(requestId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${requestId}`);
  }
  getPendingRequests(requests: ServiceRequest[]): number {
  return requests.filter(r => r.status === 'pending').length;
}

getInProgressRequests(requests: ServiceRequest[]): number {
  return requests.filter(r => r.status === 'in-progress').length;
}

getCompletedRequests(requests: ServiceRequest[]): number {
  return requests.filter(r => r.status === 'completed').length;
}

getUrgentRequests(requests: ServiceRequest[]): number {
  return requests.filter(r => r.priority === 'high').length;
}
}
