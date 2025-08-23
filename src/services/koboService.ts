interface KoBoAsset {
  uid: string;
  name: string;
  asset_type: string;
  deployment__active: boolean;
  deployment__submission_count: number;
  date_created: string;
  date_modified: string;
}

interface KoBoAssetsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: KoBoAsset[];
}

interface KoBoDataResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}

export class KoBoService {
  private baseUrl = 'https://kf.kobotoolbox.org/api/v2';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Token ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest(endpoint: string): Promise<Response> {
    const url = this.baseUrl + endpoint;
    console.log('🌐 Tentative de connexion à:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      mode: 'cors',
      credentials: 'omit'
    });
    
    console.log('📡 Réponse HTTP:', response.status, response.statusText);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token KoBoToolbox invalide. Vérifiez votre token d\'authentification.');
      } else if (response.status === 403) {
        throw new Error('Accès interdit. Vérifiez vos permissions sur cette ressource KoBoToolbox.');
      } else if (response.status === 404) {
        throw new Error('Ressource KoBoToolbox non trouvée. Vérifiez l\'URL ou l\'UID du formulaire.');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    return response;
  }

  async getAssets(): Promise<KoBoAsset[]> {
    try {
      const response = await this.makeRequest('/assets/');
      const data = await response.json();
      
      console.log('📊 Assets reçus:', data);
      
      // Filtrer seulement les formulaires déployés
      const assets = data.results?.filter((asset: KoBoAsset) => 
        asset.asset_type === 'survey' && 
        asset.deployment__active === true
      ) || [];
      
      console.log(`✅ ${assets.length} formulaires actifs trouvés`);
      return assets;
    } catch (error) {
      console.error('Erreur lors de la récupération des formulaires KoBoToolbox:', error);
      throw error;
    }
  }

  async getAssetData(assetId: string): Promise<any[]> {
    try {
      // Endpoint correct selon la doc officielle
      const endpoint = `/assets/${assetId}/data/`;
      console.log('🔄 Requête vers:', this.baseUrl + endpoint);
      
      const response = await this.makeRequest(endpoint);
      const data = await response.json();
      
      console.log('📊 Réponse API complète:', data);
      console.log('📊 Type de data:', typeof data);
      console.log('📊 Clés disponibles:', Object.keys(data || {}));
      
      // Structure standard KoboToolbox selon leur doc
      if (data && data.results) {
        console.log(`✅ ${data.count || data.results.length} soumissions trouvées`);
        return data.results;
      } else if (Array.isArray(data)) {
        console.log(`✅ ${data.length} soumissions (format direct)`);
        return data;
      } else {
        console.log('⚠️ Structure de données inattendue:', data);
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur getAssetData:', error);
      throw new Error(`Impossible de récupérer les données: ${error.message}`);
    }
  }

  async getAllData(maxRecordsPerForm: number = 100): Promise<{ formName: string; uid: string; data: any[]; count: number }[]> {
    try {
      // Étape 1: Récupérer la liste des formulaires
      const assets = await this.getAssets();
      
      if (assets.length === 0) {
        throw new Error('Aucun formulaire actif trouvé dans votre compte KoBoToolbox.');
      }

      // Étape 2: Récupérer les données de chaque formulaire
      const allData: { formName: string; uid: string; data: any[]; count: number }[] = [];
      
      for (const asset of assets) {
        try {
          const data = await this.getAssetData(asset.uid);
          
          allData.push({
            formName: asset.name,
            uid: asset.uid,
            data: data.slice(0, maxRecordsPerForm),
            count: asset.deployment__submission_count || data.length,
          });
        } catch (error) {
          console.warn(`Impossible de récupérer les données du formulaire "${asset.name}" (${asset.uid}):`, error);
          // Continuer avec les autres formulaires même si un échoue
        }
      }

      return allData;
    } catch (error) {
      console.error('Erreur lors de la récupération complète des données KoBoToolbox:', error);
      throw error;
    }
  }

  static isKoBoUrl(url: string): boolean {
    return url.includes('kobotoolbox.org');
  }

  static validateKoBoUrl(url: string): { isValid: boolean; type: 'assets' | 'data' | 'unknown'; message: string } {
    if (!this.isKoBoUrl(url)) {
      return { isValid: false, type: 'unknown', message: 'Ce n\'est pas une URL KoBoToolbox.' };
    }

    if (url.includes('/api/v2/assets/') && !url.includes('/data/')) {
      return { isValid: true, type: 'assets', message: 'URL valide pour lister les formulaires.' };
    }

    if (url.includes('/api/v2/assets/') && url.includes('/data/')) {
      return { isValid: true, type: 'data', message: 'URL valide pour récupérer les données d\'un formulaire.' };
    }

    return { 
      isValid: false, 
      type: 'unknown', 
      message: 'URL KoBoToolbox non reconnue. Utilisez /api/v2/assets/ ou /api/v2/assets/{uid}/data/' 
    };
  }
}