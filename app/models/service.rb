class Service
  class ApiError < StandardError; end

  def self.services(from, to, date, time)
    params = {
      app_id: ENV['app_id'],
      app_key: ENV['app_key'],
      calling_at: to,
      from_offset: '-PT01:00:00',
      to_offset: 'PT00:59:00',
      station_detail: 'calling_at',
      train_status: 'passenger'
    }

    url = "https://transportapi.com/v3/uk/train/station/#{from}/#{date}/#{time}/timetable.json?#{params.to_query}"

    redis = Redis.new

    if redis.exists(url)
      body = redis.get(url)
    else
      body = Faraday.get(url).body
      redis.set(url, body)
      body
    end

    result = JSON.parse(body)

    Rails.logger.debug(url)
    Rails.logger.debug(JSON.pretty_generate(result))

    if result['error']
      raise ApiError.new(result['error'])
    else
      result['departures']['all'].map{|attributes| new(from, to, date, attributes) }
    end
  end

  attr_reader :from, :to

  def initialize(from, to, date, attributes)
    @from = from
    @to = to
    @date = date
    @attributes = attributes
  end

  def new_timetable?
    @date >= '2018-05-20'
  end

  def departure_time
    @attributes['aimed_departure_time']
  end

  def arrival_time
    @attributes['station_detail']['calling_at'].last['aimed_arrival_time']
  end

  def overtaken?(services)
    services.any? {|service|
      service.new_timetable? == new_timetable? &&
      service != self &&
      service.departure_time > departure_time &&
      service.arrival_time < arrival_time
    }
  end

  def length
    ((Time.parse(arrival_time) - Time.parse(departure_time)) / 60).round
  end
end
