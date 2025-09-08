import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CapacitorHttp } from '@capacitor/core';
import { environment } from 'src/environments/environment';

export interface AiqContact {
  id?: string;           // depends on your backend response
  firstName?: string;
  lastName?: string;
  email?: string;
  mobilePhone?: string;
  address?: string;
  favoriteStore?: string;
  loyalty?: boolean;
  // add any other fields your backend returns
}

export interface AiqWallet {
  // shape depends on AIQ response you proxy back
  // leave generic if unknown:
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AlpineService {
  private baseUrl = `${environment.apiUrl}/alpine`;

  private contactSubject = new BehaviorSubject<AiqContact | null>(null);
  private walletSubject  = new BehaviorSubject<AiqWallet  | null>(null);

  contact$ = this.contactSubject.asObservable();
  wallet$  = this.walletSubject.asObservable();

  constructor() {
    // load cached on startup (optional)
    const c = localStorage.getItem('aiq_contact');
    const w = localStorage.getItem('aiq_wallet');
    if (c) this.contactSubject.next(JSON.parse(c));
    if (w) this.walletSubject.next(JSON.parse(w));
  }

  /** Create/sync contact in AIQ (POST /alpine/loyalty) */
  async createOrSyncContact(payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobilePhone?: string;
    address?: string;
    favoriteStore?: string;
    loyalty?: boolean;
  }): Promise<any> {
    const res = await CapacitorHttp.post({
      url: `${this.baseUrl}/loyalty`,
      headers: { 'Content-Type': 'application/json' },
      data: payload
    });
    // Some backends return the contact object; if so, cache it:
    if (res?.data) {
      localStorage.setItem('aiq_contact', JSON.stringify(res.data));
      this.contactSubject.next(res.data);
    }
    return res.data;
  }

  /** GET /alpine/lookup/:phone */
  async lookupByPhone(phone: string): Promise<AiqContact | null> {
    const res = await CapacitorHttp.get({ url: `${this.baseUrl}/lookup/${encodeURIComponent(phone)}` });
    const contact = res?.data ?? null; 
    if (contact) {
      localStorage.setItem('aiq_contact', JSON.stringify(contact));
      this.contactSubject.next(contact);
    }
    return contact;
  }

  /** GET /alpine/lookup/email/:email */
  async lookupByEmail(email: string): Promise<AiqContact | null> {
    const res = await CapacitorHttp.get({ url: `${this.baseUrl}/lookup/email/${encodeURIComponent(email)}` });
    const contact = res?.data ?? null;
    if (contact) {
      localStorage.setItem('aiq_contact', JSON.stringify(contact));
      this.contactSubject.next(contact);
    }
    return contact;
  }

  /** GET /alpine/wallet/:phone */
  async getWalletByPhone(phone: string): Promise<AiqWallet | null> {
    const res = await CapacitorHttp.get({ url: `${this.baseUrl}/wallet/${encodeURIComponent(phone)}` });
    const wallet = res?.data ?? null;
    if (wallet) {
      localStorage.setItem('aiq_wallet', JSON.stringify(wallet));
      this.walletSubject.next(wallet);
    }
    return wallet;
  }

  clearAiqCache(): void {
    localStorage.removeItem('aiq_contact');
    localStorage.removeItem('aiq_wallet');
    this.contactSubject.next(null);
    this.walletSubject.next(null);
  }
}
