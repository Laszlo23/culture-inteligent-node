/** Optional peer — install `@zkpassport/sdk` for live NFC uniqueness. */
declare module '@zkpassport/sdk' {
  export class ZKPassport {
    constructor(domain?: string);
    request(options: Record<string, unknown>): Promise<{
      gte: (field: string, value: number) => any;
      disclose: (field: string) => any;
      done: () => {
        url: string;
        onResult?: (cb: (response: any) => void) => void;
        onError?: (cb: (message: string) => void) => void;
        onReject?: (cb: () => void) => void;
      };
    }>;
    verify(args: Record<string, unknown>): Promise<{
      uniqueIdentifier: string | undefined;
      verified: boolean;
    }>;
  }
}
