/**
 * @module @wesib/generic
 */
import { Page } from '../page';

export type PageLoadResponse = PageLoadResponse.Ok | PageLoadResponse.Failure;

export namespace PageLoadResponse {

  export interface Ok {

    readonly ok: true;

    readonly page: Page;

    readonly response: Response;

    readonly document: Document;

    readonly error?: undefined;

  }

  export interface Failure {

    readonly ok: false;

    readonly page: Page;

    readonly response?: Response;

    readonly document?: Document;

    readonly error: any;

  }

}
