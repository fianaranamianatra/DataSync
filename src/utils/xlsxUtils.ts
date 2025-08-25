import * as XLSX from 'xlsx';

export interface XlsxParseResult {
  data: any[];
  sheetNames: string[];
  totalRows: number;
}

export class XlsxUtils {
  /**
   * Vérifie si une URL pointe vers un fichier XLSX
   */
  static isXlsxUrl(url: string): boolean {
    return url.toLowerCase().includes('.xlsx') || url.toLowerCase().includes('.xls');
  }

  /**
   * Parse un ArrayBuffer contenant un fichier XLSX
   */
  static parseXlsxBuffer(buffer: ArrayBuffer): XlsxParseResult {
    try {
      // Lire le fichier Excel
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Le fichier Excel ne contient aucune feuille de calcul.');
      }

      // Prendre la première feuille
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      if (!worksheet) {
        throw new Error('Impossible de lire la première feuille de calcul.');
      }

      // Convertir en JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Utiliser la première ligne comme en-têtes
        defval: '', // Valeur par défaut pour les cellules vides
        raw: false // Convertir les dates et nombres en chaînes
      });

      if (jsonData.length === 0) {
        throw new Error('La feuille de calcul est vide.');
      }

      // Extraire les en-têtes (première ligne)
      const headers = jsonData[0] as string[];
      
      if (!headers || headers.length === 0) {
        throw new Error('Aucun en-tête trouvé dans la première ligne.');
      }

      // Convertir les données en objets avec les en-têtes comme clés
      const dataRows = jsonData.slice(1) as any[][];
      const objectData = dataRows
        .filter(row => row && row.some(cell => cell !== '' && cell !== null && cell !== undefined))
        .map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            if (header && header.trim() !== '') {
              // Sanitize header to comply with Firestore field naming restrictions
              let sanitizedHeader = header.trim();
              
              // Remove leading and trailing double underscores (reserved by Firestore)
              if (sanitizedHeader.startsWith('__') && sanitizedHeader.endsWith('__')) {
                sanitizedHeader = sanitizedHeader.replace(/^__/, '').replace(/__$/, '');
                
                // If header becomes empty after sanitization, use a fallback
                if (sanitizedHeader === '') {
                  sanitizedHeader = `field_${index}`;
                }
              }
              
              obj[sanitizedHeader] = row[index] || '';
            }
          });
          return obj;
        });

      return {
        data: objectData,
        sheetNames: workbook.SheetNames,
        totalRows: objectData.length
      };
    } catch (error) {
      console.error('Erreur lors du parsing XLSX:', error);
      if (error instanceof Error) {
        throw new Error(`Erreur de lecture du fichier Excel: ${error.message}`);
      } else {
        throw new Error('Erreur inconnue lors de la lecture du fichier Excel.');
      }
    }
  }

  /**
   * Télécharge et parse un fichier XLSX depuis une URL
   */
  static async fetchAndParseXlsx(url: string, token?: string): Promise<XlsxParseResult> {
    try {
      // Valider l'URL
      new URL(url);
    } catch (urlError) {
      throw new Error('URL invalide. Vérifiez le format de l\'URL.');
    }

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*',
    };

    if (token) {
      // Support pour différents types d'authentification
      if (url.includes('kobotoolbox.org')) {
        headers['Authorization'] = `Token ${token}`;
      } else {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const fetchOptions: RequestInit = {
      method: 'GET',
      headers,
      mode: 'cors',
      credentials: 'omit',
    };

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Fichier non trouvé (404). Vérifiez que l'URL "${url}" est correcte.`);
        } else if (response.status === 401) {
          throw new Error('Non autorisé (401). Vérifiez votre token d\'authentification.');
        } else if (response.status === 403) {
          throw new Error('Accès interdit (403). Vérifiez vos permissions sur cette ressource.');
        } else if (response.status >= 500) {
          throw new Error(`Erreur serveur (${response.status}). Le serveur rencontre des problèmes.`);
        } else {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('L\'URL semble pointer vers une page web (HTML) plutôt qu\'un fichier Excel.');
      }

      // Récupérer le contenu en tant qu'ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Le fichier téléchargé est vide.');
      }

      // Parser le fichier XLSX
      return this.parseXlsxBuffer(arrayBuffer);
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        if (fetchError.message.includes('Failed to fetch')) {
          throw new Error('Impossible de télécharger le fichier. Vérifiez l\'URL et votre connexion internet.');
        } else if (fetchError.message.includes('CORS')) {
          throw new Error('Problème CORS. Le serveur ne permet pas le téléchargement depuis cette application.');
        } else if (fetchError.message.includes('NetworkError')) {
          throw new Error('Erreur réseau. Vérifiez votre connexion internet.');
        } else {
          throw fetchError;
        }
      } else {
        throw new Error('Erreur inconnue lors du téléchargement du fichier.');
      }
    }
  }

  /**
   * Valide qu'un fichier XLSX peut être lu (pour les tests de connexion)
   */
  static async validateXlsxUrl(url: string, token?: string): Promise<{ isValid: boolean; message: string; sampleData?: any }> {
    try {
      const result = await this.fetchAndParseXlsx(url, token);
      
      const sampleData = result.data.slice(0, 3); // Prendre les 3 premiers enregistrements comme échantillon
      
      return {
        isValid: true,
        message: `Fichier Excel valide ! ${result.totalRows} ligne${result.totalRows > 1 ? 's' : ''} de données trouvée${result.totalRows > 1 ? 's' : ''} dans la feuille "${result.sheetNames[0]}".`,
        sampleData
      };
    } catch (error) {
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue lors de la validation du fichier Excel.'
      };
    }
  }
}