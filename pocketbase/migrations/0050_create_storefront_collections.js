migrate(
  (app) => {
    // 1. Coleção stores (Lojas da plataforma Storefront)
    try {
      app.findCollectionByNameOrId('stores')
    } catch (_) {
      const storesCollection = new Collection({
        name: 'stores',
        type: 'base',
        listRule: '', // Público para consulta no site e resolução de domínio
        viewRule: '', // Público
        createRule: '@request.auth.role = "master"', // Master via SDK ou hooks
        updateRule: '@request.auth.role = "master"',
        deleteRule: '@request.auth.role = "master"',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'slug', type: 'text', required: true },
          { name: 'domain', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['active', 'inactive'],
            maxSelect: 1,
          },
          { name: 'tagline', type: 'text', required: false },
          { name: 'description', type: 'text', required: false },
          // Cores da paleta (hex)
          { name: 'color_primary', type: 'text', required: false }, // Ex: #4A0E17 (vinho)
          { name: 'color_secondary', type: 'text', required: false }, // Ex: #D4AF37 (dourado)
          { name: 'color_background', type: 'text', required: false }, // Ex: #FAF8F5 (marfim/fundo)
          { name: 'color_surface', type: 'text', required: false }, // Ex: #2D050B (vinho escuro/superfície)
          { name: 'color_accent', type: 'text', required: false }, // Ex: #E5C158 (dourado claro)
          // Mídia / Identidade
          {
            name: 'logo_url',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
          },
          {
            name: 'hero_url',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 15728640,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          },
          {
            name: 'favicon_url',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/x-icon', 'image/png', 'image/svg+xml'],
          },
          // Tipografia
          { name: 'font_display', type: 'text', required: false },
          { name: 'font_body', type: 'text', required: false },
          // Contatos e Redes
          { name: 'whatsapp_contato', type: 'text', required: false },
          { name: 'instagram', type: 'text', required: false },
          { name: 'email_contato', type: 'text', required: false },
          { name: 'youtube_canal', type: 'text', required: false },
          // Textos do Hero
          { name: 'hero_title', type: 'text', required: false },
          { name: 'hero_subtitle', type: 'text', required: false },
          { name: 'hero_tagline_words', type: 'text', required: false }, // Ex: "AUTONOMIA • PROPÓSITO • LIBERDADE"
          { name: 'hero_phrase', type: 'text', required: false }, // Frase manuscrita/destaque
          // Institucional
          { name: 'mission_text', type: 'text', required: false },
          { name: 'vision_text', type: 'text', required: false },
          { name: 'values_text', type: 'text', required: false },
          { name: 'manifesto_text', type: 'text', required: false },
          { name: 'company_name', type: 'text', required: false }, // Razão social opcional no rodapé
          // Toggles de seções (JSON)
          { name: 'sections_toggles', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_stores_slug ON stores (slug)',
          'CREATE INDEX idx_stores_domain ON stores (domain)',
          'CREATE INDEX idx_stores_status ON stores (status)',
        ],
      })
      app.save(storesCollection)
    }

    const storesCol = app.findCollectionByNameOrId('stores')
    const storesId = storesCol.id

    // 2. Coleção store_members (Integrantes da loja)
    try {
      app.findCollectionByNameOrId('store_members')
    } catch (_) {
      const membersCol = new Collection({
        name: 'store_members',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.role = "master"',
        updateRule: '@request.auth.role = "master"',
        deleteRule: '@request.auth.role = "master"',
        fields: [
          {
            name: 'store',
            type: 'relation',
            required: true,
            collectionId: storesId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'name', type: 'text', required: true },
          { name: 'role', type: 'text', required: false },
          { name: 'bio', type: 'text', required: false },
          {
            name: 'photo_url',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          },
          { name: 'instagram', type: 'text', required: false },
          { name: 'order', type: 'number', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_store_members_store ON store_members (store)',
          'CREATE INDEX idx_store_members_order ON store_members (order)',
        ],
      })
      app.save(membersCol)
    }

    // 3. Coleção store_episodes (Episódios da loja)
    try {
      app.findCollectionByNameOrId('store_episodes')
    } catch (_) {
      const episodesCol = new Collection({
        name: 'store_episodes',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.role = "master"',
        updateRule: '@request.auth.role = "master"',
        deleteRule: '@request.auth.role = "master"',
        fields: [
          {
            name: 'store',
            type: 'relation',
            required: true,
            collectionId: storesId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text', required: false },
          { name: 'youtube_url', type: 'text', required: true },
          { name: 'publish_date', type: 'date', required: false },
          {
            name: 'cover_url',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          },
          { name: 'order', type: 'number', required: false },
          {
            name: 'status',
            type: 'select',
            required: false,
            values: ['published', 'draft'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_store_episodes_store ON store_episodes (store)',
          'CREATE INDEX idx_store_episodes_order ON store_episodes (order)',
        ],
      })
      app.save(episodesCol)
    }

    // 4. Coleção store_banners (Banners da loja)
    try {
      app.findCollectionByNameOrId('store_banners')
    } catch (_) {
      const bannersCol = new Collection({
        name: 'store_banners',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.role = "master"',
        updateRule: '@request.auth.role = "master"',
        deleteRule: '@request.auth.role = "master"',
        fields: [
          {
            name: 'store',
            type: 'relation',
            required: true,
            collectionId: storesId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'title', type: 'text', required: true },
          {
            name: 'image_url',
            type: 'file',
            required: true,
            maxSelect: 1,
            maxSize: 15728640,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          },
          { name: 'link_url', type: 'text', required: false },
          {
            name: 'position',
            type: 'select',
            required: true,
            values: ['hero', 'inline'],
            maxSelect: 1,
          },
          { name: 'active', type: 'bool', required: false },
          { name: 'order', type: 'number', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_store_banners_store ON store_banners (store)',
          'CREATE INDEX idx_store_banners_order ON store_banners (order)',
        ],
      })
      app.save(bannersCol)
    }

    // 5. Coleção store_testimonials (Depoimentos da loja)
    try {
      app.findCollectionByNameOrId('store_testimonials')
    } catch (_) {
      const testimonialsCol = new Collection({
        name: 'store_testimonials',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '', // Permite envio público de depoimento na loja
        updateRule: '@request.auth.role = "master"',
        deleteRule: '@request.auth.role = "master"',
        fields: [
          {
            name: 'store',
            type: 'relation',
            required: true,
            collectionId: storesId,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'name', type: 'text', required: true },
          { name: 'role', type: 'text', required: false },
          { name: 'instagram', type: 'text', required: false },
          { name: 'message', type: 'text', required: true },
          {
            name: 'photo_url',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 10485760,
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          },
          { name: 'video_url', type: 'text', required: false },
          { name: 'approved', type: 'bool', required: false },
          { name: 'order', type: 'number', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_store_testim_store ON store_testimonials (store)',
          'CREATE INDEX idx_store_testim_approved ON store_testimonials (approved)',
        ],
      })
      app.save(testimonialsCol)
    }
  },
  (app) => {
    const list = [
      'store_testimonials',
      'store_banners',
      'store_episodes',
      'store_members',
      'stores',
    ]
    for (let i = 0; i < list.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(list[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
