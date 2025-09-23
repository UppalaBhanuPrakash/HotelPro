import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Service } from '../../services/service';
import { ServiceRequest, ServiceType, ServiceStatus, Priority } from '../../models/interfaces';
import { Observable } from 'rxjs';
import { finalize,map } from 'rxjs';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service.html',
  styleUrl: './service.css'
})
export class ServicesComponent implements OnInit {
  serviceRequests$!: Observable<ServiceRequest[]>;
allRequests: ServiceRequest[] = [];
 editingServiceId: string | null = null
  // counters
  pendingCount = 0;
  inProgressCount = 0;
  completedCount = 0;
  urgentCount = 0;

  // filters
  filterType = '';
  filterStatus = '';
  filterPriority = '';

  // UI states
  selectedService: ServiceRequest | null = null;
  showNewServiceModal = false;
  loading = false;

  // form model for new request
  newServiceRequest = {
    roomNumber: '',
    type: '' as ServiceType,
    priority: '' as Priority,
    description: '',
    status: 'pending' as ServiceStatus,
    assignedTo: ''
  };

  constructor(private service: Service) {}

  ngOnInit() {
    this.loadRequests();
  }

  //  Load and compute counts
 loadRequests() {
  this.loading = true;
  this.service.getServiceRequests()
    .pipe(finalize(() => this.loading = false))
    .subscribe(reqs => {
      this.allRequests = reqs; // keep unfiltered list
      this.pendingCount = reqs.filter(r => r.status === 'pending').length;
      this.inProgressCount = reqs.filter(r => r.status === 'in-progress').length;
      this.completedCount = reqs.filter(r => r.status === 'completed').length;
      this.urgentCount = reqs.filter(r => r.priority === 'high').length;
    });
}

editService(service: ServiceRequest) {
  this.newServiceRequest = { 
    roomNumber: service.roomNumber,
    type: service.type,
    priority: service.priority,
    description: service.description,
    status: service.status,
    assignedTo: service.assignedTo || ''
  };
  this.showNewServiceModal = true;
  this.editingServiceId = service.id; // Store the ID to know which service is being edited
}
  //  Actions
  assignService(requestId: string) {
    this.loading = true;
    this.service.updateServiceRequest(requestId, {
      assignedTo: 'Staff Member',
      status: 'pending'
    }).pipe(finalize(() => this.loading = false))
      .subscribe(() => this.loadRequests());
  }

  startService(requestId: string) {
    this.loading = true;
    this.service.updateServiceRequest(requestId, { status: 'in-progress' })
      .pipe(finalize(() => this.loading = false))
      .subscribe(() => this.loadRequests());
  }

  completeService(requestId: string) {
    this.loading = true;
    this.service.updateServiceRequest(requestId, {
      status: 'completed',
      completedAt: new Date()
    }).pipe(finalize(() => this.loading = false))
      .subscribe(() => this.loadRequests());
  }
  get filteredRequests(): ServiceRequest[] {
  let filtered = this.allRequests; // we'll store raw data separately

  if (this.filterType) {
    filtered = filtered.filter(r => r.type === this.filterType);
  }
  if (this.filterStatus) {
    filtered = filtered.filter(r => r.status === this.filterStatus);
  }
  if (this.filterPriority) {
    filtered = filtered.filter(r => r.priority === this.filterPriority);
  }

  return filtered;
}

  cancelService(requestId: string) {
    this.loading = true;
    this.service.updateServiceRequest(requestId, { status: 'cancelled' })
      .pipe(finalize(() => this.loading = false))
      .subscribe(() => this.loadRequests());
  }

  deleteService(requestId: string) {
    this.loading = true;
    this.service.deleteServiceRequest(requestId)
      .pipe(finalize(() => this.loading = false))
      .subscribe(() => this.loadRequests());
  }

  //  Modal handling
  viewServiceDetails(service: ServiceRequest) {
    this.selectedService = service;
  }

  closeServiceDetails() {
    this.selectedService = null;
  }

  openNewServiceModal() {
    this.showNewServiceModal = true;
  }

 closeNewServiceModal() {
  this.showNewServiceModal = false;
  this.resetNewServiceForm();
  this.editingServiceId = null;
}
  //  Create new request
 submitServiceRequest() {
  if (!this.newServiceRequest.roomNumber || !this.newServiceRequest.type ||
      !this.newServiceRequest.priority || !this.newServiceRequest.description) return;

  this.loading = true;

  const requestPayload = {
    roomNumber: this.newServiceRequest.roomNumber,
    type: this.newServiceRequest.type,
    priority: this.newServiceRequest.priority,
    description: this.newServiceRequest.description,
    status: this.newServiceRequest.status,
    assignedTo: this.newServiceRequest.assignedTo || undefined
  };

  let obs: Observable<any>;
  
  if (this.editingServiceId) {
    obs = this.service.updateServiceRequest(this.editingServiceId, requestPayload);
  } else {
    obs = this.service.addServiceRequest(requestPayload);
  }

  obs.pipe(finalize(() => this.loading = false))
    .subscribe(() => {
      this.closeNewServiceModal();
      this.loadRequests();
      this.editingServiceId = null; // reset edit mode
    });
}

  resetNewServiceForm() {
    this.newServiceRequest = {
      roomNumber: '',
      type: '' as ServiceType,
      priority: '' as Priority,
      description: '',
      status: 'pending' as ServiceStatus,
      assignedTo: ''
    };
  }

  clearFilters() {
    this.filterType = '';
    this.filterStatus = '';
    this.filterPriority = '';
  }

  //  Icons
  getServiceIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'housekeeping': '<i class="bi bi-house fs-4"></i',
    'maintenance': '<i class="bi bi-tools fs-4"></i>',
    'room-service': '<i class="bi bi-cup-hot fs-4"></i>',
    'concierge': '<i class="bi bi-bell fs-4"></i>',
    'laundry': '<i class="bi bi-person fs-4"></i>'
  };
  return icons[type] || '<i class="bi bi-clipboard fs-4"></i>';
}

}