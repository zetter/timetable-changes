Rails.application.routes.draw do
  get '/services', to: 'services#index', as: :services
  get '/:from/:to/:time.json', to: 'services#json', as: :services_json
  get '/:from/:to/:time', to: 'services#show', as: :service
  get '/', to: 'pages#home'
end
