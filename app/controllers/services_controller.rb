class ServicesController < ApplicationController
  def index
  end

  def json
    old_date = '2018-04-24'
    new_date = '2018-05-22'

    @services = Service.services(params[:from], params[:to], old_date, params[:time])
    @services += Service.services(params[:from], params[:to], new_date, params[:time])

    stations = [
      {name: params[:from], distance: 0},
      {name: params[:to], distance: 50}
    ]

    if params[:from] == 'KGX'
      @services += Service.services('STP', params[:to], new_date, params[:time])
      stations << {name: 'STP', distance: 5}
    elsif params[:to] == 'KGX'
      @services += Service.services(params[:from], 'STP', new_date, params[:time])
      stations << {name: 'STP', distance: 55}
    end

    data = {
      domain_start: @services.map(&:departure_time).min,
      domain_end: @services.map(&:arrival_time).max,
      stations: stations,
      services: @services.map{|service|
        {
          from: service.from,
          departure: service.departure_time,
          to: service.to,
          arrival: service.arrival_time,
          overtaken: service.overtaken?(@services),
          new_timetable: service.new_timetable?,
          length: service.length
        }
      }
    };

    render json: data
  end
end
