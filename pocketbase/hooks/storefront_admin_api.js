// pocketbase/hooks/storefront_admin_api.js
// Endpoints administrativos protegidos para gestão da plataforma Storefront (Multi-Loja)
// Exclusivo para usuários com cargo Master. Permite listar, criar, editar e excluir lojas com contadores agregados.

routerAdd(
  'GET',
  '/backend/v1/stores/overview',
  (e) => {
    try {
      const user = e.auth
      if (!user) {
        return e.unauthorizedError('Acesso restrito ao painel administrativo.')
      }

      const userRole = user.getString('role')
      if (userRole !== 'master') {
        return e.forbiddenError('Acesso restrito exclusivamente ao cargo Master.')
      }

      const stores = $app.findRecordsByFilter('stores', '', '-created', 500, 0)
      const result = []

      for (let i = 0; i < stores.length; i++) {
        const store = stores[i]
        const storeId = store.id

        // Contar membros, episódios, banners, depoimentos
        const membersCount = $app.countRecords(
          'store_members',
          $dbx.exp('store = {:id}', { id: storeId }),
        )
        const episodesCount = $app.countRecords(
          'store_episodes',
          $dbx.exp('store = {:id}', { id: storeId }),
        )
        const bannersCount = $app.countRecords(
          'store_banners',
          $dbx.exp('store = {:id}', { id: storeId }),
        )
        const testimonialsCount = $app.countRecords(
          'store_testimonials',
          $dbx.exp('store = {:id}', { id: storeId }),
        )

        result.push({
          id: store.id,
          name: store.getString('name'),
          slug: store.getString('slug'),
          domain: store.getString('domain'),
          status: store.getString('status'),
          tagline: store.getString('tagline'),
          description: store.getString('description'),
          color_primary: store.getString('color_primary'),
          color_secondary: store.getString('color_secondary'),
          color_background: store.getString('color_background'),
          color_surface: store.getString('color_surface'),
          color_accent: store.getString('color_accent'),
          logo_url: store.getString('logo_url'),
          hero_url: store.getString('hero_url'),
          favicon_url: store.getString('favicon_url'),
          font_display: store.getString('font_display'),
          font_body: store.getString('font_body'),
          whatsapp_contato: store.getString('whatsapp_contato'),
          instagram: store.getString('instagram'),
          email_contato: store.getString('email_contato'),
          youtube_canal: store.getString('youtube_canal'),
          hero_title: store.getString('hero_title'),
          hero_subtitle: store.getString('hero_subtitle'),
          hero_tagline_words: store.getString('hero_tagline_words'),
          hero_phrase: store.getString('hero_phrase'),
          mission_text: store.getString('mission_text'),
          vision_text: store.getString('vision_text'),
          values_text: store.getString('values_text'),
          manifesto_text: store.getString('manifesto_text'),
          company_name: store.getString('company_name'),
          sections_toggles: store.get('sections_toggles'),
          created: store.getString('created'),
          updated: store.getString('updated'),
          counts: {
            members: membersCount,
            episodes: episodesCount,
            banners: bannersCount,
            testimonials: testimonialsCount,
          },
        })
      }

      return e.json(200, {
        stores: result,
      })
    } catch (err) {
      console.log('Erro ao listar lojas no storefront_admin_api:', err)
      return e.json(500, {
        error: 'Falha ao buscar visão geral das lojas: ' + (err.message || String(err)),
      })
    }
  },
  $apis.requireAuth(),
)
