class ServicesController < ApplicationController
  def index
    from = params.fetch(:from, '').upcase.strip
    to = params.fetch(:to, '').upcase.strip
    if from.length != 3 || to.length != 3
      flash[:alert] = 'Please use 3-letter station codes.'
      render 'pages/home'
    else
      redirect_to service_path(from, to, params[:day], params[:time])
    end
  end

  def show
  end

  def json
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
  rescue Service::ApiError
    render json: {error: true}
  end

  DATES = {
    'weekday' => ['2018-04-24', '2018-05-22'],
    'saturday' => ['2018-04-21', '2018-05-26'],
    'sunday' => ['2018-04-22', '2018-05-27']
  }

  def old_date
    DATES[params[:day].downcase].first
  end
  helper_method :old_date

  def new_date
    DATES[params[:day].downcase].second
  end
  helper_method :new_date
end
