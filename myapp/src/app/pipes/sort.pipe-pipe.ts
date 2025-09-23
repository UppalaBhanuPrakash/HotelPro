import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortPipe'
})
export class SortPipePipe implements PipeTransform {

  transform(array: any[], field: string): any[] {
    return array ? [...array].sort((a, b) => a[field] - b[field]) : [];
  }

}
