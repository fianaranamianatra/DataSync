/**
 * Utilitaires pour gérer les requêtes API avec gestion automatique des problèmes CORS
 */
export class ApiUtils {
  static CORS_PROXY = 'https://api.allorigins.win/get?url=';

  /**
   * Effectue une requête avec gestion automatique des problèmes CORS
   * @param {string} url - URL à requêter
   * @param {Object} options - Options de la requête fetch
   * @param {boolean} useProxy - Forcer l'utilisation du proxy
   * @returns {Promise<Response>} - Réponse de la requête
   */
  static async fetchWithCorsHandling(url, options = {}, useProxy = false) {
    // Tentative directe d'abord (sauf si proxy forcé)
    if (!useProxy) {
      try {
        const response = await fetch(url, {
          ...options,
          mode: 'cors',
          credentials: 'omit',
        });
        return { response, usedProxy: false };
      } catch (error) {
        // Si l'erreur est liée à CORS, on essaie avec le proxy
        if (error.message.includes('CORS') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError')) {
          console.log('Requête directe échouée, tentative avec proxy CORS...');
          return this.fetchWithCorsHandling(url, options, true);
        }
        throw error;
      }
    }

    // Utilisation du proxy CORS
    try {
      const proxyUrl = `${this.CORS_PROXY}${encodeURIComponent(url)}`;
      const proxyOptions = {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
        }
      };

      const proxyResponse = await fetch(proxyUrl, proxyOptions);
      
      if (!proxyResponse.ok) {
        throw new Error(`Erreur proxy: ${proxyResponse.status} ${proxyResponse.statusText}`);
      }

      const proxyData = await proxyResponse.json();
      
      // Le proxy retourne les données dans proxyData.contents
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json'
        }),
        json: async () => {
          try {
            return JSON.parse(proxyData.contents);
          } catch (parseError) {
            // Si ce n'est pas du JSON, retourner le contenu brut
            return proxyData.contents;
          }
        },
        text: async () => proxyData.contents,
      };

      return { response: mockResponse, usedProxy: true };
    } catch (proxyError) {
      throw new Error(`Impossible d'accéder à l'URL même via le proxy CORS: ${proxyError.message}`);
    }
  }

  /**
   * Teste la connectivité d'une URL avec gestion automatique CORS
   * @param {string} url - URL à tester
   * @param {string} token - Token d'authentification optionnel
   * @returns {Promise<Object>} - Résultat du test
   */
  static async testConnection(url, token = '') {
    try {
      // Valider l'URL
      new URL(url);
    } catch (urlError) {
      return {
        success: false,
        message: 'URL invalide. Vérifiez le format de l\'URL.',
        usedProxy: false
      };
    }

    const headers = {
      'Accept': 'application/json',
    };

    if (token) {
      if (url.includes('kobotoolbox.org')) {
        headers['Authorization'] = `Token ${token}`;
      } else {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const { response, usedProxy } = await this.fetchWithCorsHandling(url, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/html')) {
          return {
            success: false,
            message: 'L\'URL semble pointer vers une page web. Utilisez un endpoint API qui retourne du JSON.',
            usedProxy
          };
        }

        try {
          const testData = await response.json();
          let message = 'Connexion réussie ! L\'endpoint retourne du JSON valide.';
          
          // Messages spécifiques pour KoBoToolbox
          if (url.includes('kobotoolbox.org')) {
            if (url.includes('/assets') && !url.includes('/submissions/')) {
              message = `Connexion réussie ! ${Array.isArray(testData.results) ? testData.results.length : 'Plusieurs'} formulaire(s) trouvé(s).`;
            } else if (url.includes('/data/') || url.includes('/submissions/')) {
              message = 'Connexion réussie ! Données de formulaire accessibles.';
            } else {
              message = 'Connexion réussie ! Endpoint KoBoToolbox accessible.';
            }
          }

          if (usedProxy) {
            message += ' (via proxy CORS)';
          }

          return {
            success: true,
            message,
            usedProxy,
            sampleData: testData
          };
        } catch (jsonError) {
          return {
            success: false,
            message: 'L\'endpoint est accessible mais ne retourne pas du JSON valide.',
            usedProxy
          };
        }
      } else {
        let message = `Erreur: ${response.status} ${response.statusText}`;
        
        if (response.status === 404) {
          message = 'Endpoint non trouvé (404). Vérifiez l\'URL.';
        } else if (response.status === 401) {
          if (url.includes('kobotoolbox.org')) {
            message = 'Non autorisé (401). Vérifiez votre token KoBoToolbox.';
          } else {
            message = 'Non autorisé (401). Vérifiez votre token d\'authentification.';
          }
        } else if (response.status === 403) {
          message = 'Accès interdit (403). Vérifiez vos permissions sur cette ressource.';
        }

        return {
          success: false,
          message,
          usedProxy
        };
      }
    } catch (error) {
      console.error('Erreur de test de connexion:', error);
      
      let errorMessage = 'Erreur de connexion inconnue';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Impossible de contacter l\'API. Vérifiez l\'URL et votre connexion internet.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
      } else if (error.message.includes('proxy')) {
        errorMessage = error.message;
      } else {
        errorMessage = `Erreur de connexion: ${error.message}`;
      }

      return {
        success: false,
        message: errorMessage,
        usedProxy: false
      };
    }
  }

  /**
   * Effectue une requête de synchronisation avec gestion CORS
   * @param {string} url - URL de l'API
   * @param {string} token - Token d'authentification
   * @returns {Promise<Object>} - Données synchronisées
   */
  static async syncData(url, token = '') {
    const headers = {
      'Accept': 'application/json',
    };

    if (token) {
      if (url.includes('kobotoolbox.org')) {
        headers['Authorization'] = `Token ${token}`;
      } else {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const { response, usedProxy } = await this.fetchWithCorsHandling(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Endpoint non trouvé (404). Vérifiez que l'URL "${url}" est correcte.`);
      } else if (response.status === 401) {
        throw new Error('Non autorisé (401). Vérifiez votre token d\'authentification.');
      } else if (response.status === 403) {
        throw new Error('Accès interdit (403). Vérifiez vos permissions.');
      } else if (response.status >= 500) {
        throw new Error(`Erreur serveur (${response.status}). Le serveur API rencontre des problèmes.`);
      } else {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('text/html')) {
      throw new Error(`L'URL semble pointer vers une page web (HTML) plutôt qu'un endpoint API.`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error('La réponse de l\'API n\'est pas un JSON valide.');
    }

    if (data === null || data === undefined) {
      throw new Error('L\'API a retourné des données vides.');
    }

    // Convertir en tableau si nécessaire
    let dataArray;
    if (Array.isArray(data)) {
      dataArray = data;
    } else if (typeof data === 'object' && data !== null) {
      if (data.results && Array.isArray(data.results)) {
        dataArray = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        dataArray = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        dataArray = data.items;
      } else if (url.includes('kobotoolbox.org') && (url.includes('/data/') || url.includes('/submissions/'))) {
        dataArray = [data];
      } else {
        dataArray = [data];
      }
    } else {
      dataArray = [data];
    }

    return {
      data: dataArray,
      usedProxy,
      source: url
    };
  }
}