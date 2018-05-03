Rails.application.routes.draw do
  get '/services', to: 'services#index', as: :services
  get '/:from/:to/:day/:time.json', to: 'services#json', as: :services_json
  get '/:from/:to/:day/:time', to: 'services#show', as: :service
  get '/', to: 'pages#home'
end
