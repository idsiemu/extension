export const localStorage = {
  storage: chrome.storage.local,

  async addItems(key: string, data: any) {
    let items: any = [];
    items = await this.getAllStorageSyncData(key);
    try {
      items = items.filter((item: any) => item !== data);
    } catch (e) {
      items = [];
      // console.log('addItems', e);
    }

    items.push(data);
    // @ts-ignore
    this.setStorageSyncData(key, items);
    return items;
  },

  async getItem(key: string) {
    return await this.getAllStorageSyncData(key);
  },

  async getAllStorageSyncData(key = '') {
    if (key === '') return {}
    try {
      return new Promise((resolve, reject) => {
        this.storage.get(key, (items) => {
          if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
          let data = items[key];
          if ('string' === typeof data) {
            try { data = JSON.parse(data); }
            catch (e) {
              console.error('Error parsing JSON:', e);
              return null;
            }
          }
          resolve(data);
        })
      });
    } catch (e) {
      console.error('getAllStorageSyncData', e);
      return null;
    }
  },

  async removeItem(key = '', value: any) {
    let items: any = await this.getItem(key);
    if (items === undefined || items === null) return;

    items = items.filter((item: any) => item.product !== value.product);
    this.setItem(key, items);
  },

  setItem(key: string, value: any) {
    let data: any = {};
    data[key] = JSON.stringify(value);
    this.storage.set(data);
  },

  clear() {
    this.storage.clear();
  }
}
