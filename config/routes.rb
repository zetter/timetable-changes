Rails.application.routes.draw do
  get '/:from/:to/:time.json', to: 'services#json', as: :services_json
  get '/:from/:to/:time', to: 'services#index'
end
