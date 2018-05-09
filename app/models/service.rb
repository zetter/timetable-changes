class Service
  class ApiError < StandardError; end

  def self.services(from, to, date, time)
    if time == '00:00'
      from_offset = 'PT00:00:00'
    else
      from_offset = '-PT01:00:00'
    end

    if time == '23:00'
      to_offset = 'PT00:59:00'
    else
      to_offset = 'PT01:00:00'
    end

    params = {
      app_id: ENV['app_id'],
      app_key: ENV['app_key'],
      calling_at: to,
      from_offset: from_offset,
      to_offset: to_offset,
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
    @date = Date.parse(date)
    @attributes = attributes
  end

  def new_timetable?
    @date >= Date.parse('2018-05-20')
  end

  def departure_datetime
    Time.zone.parse("#{@date} #{departure_time}")
  end

  def arrival_datetime
    if departure_time < arrival_time
      Time.zone.parse("#{@date} #{arrival_time}")
    else
      Time.zone.parse("#{@date + 1.day} #{arrival_time}")
    end
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
      service.departure_datetime > departure_datetime &&
      service.arrival_datetime < arrival_datetime
    }
  end

  def length
    ((arrival_datetime - departure_datetime) / 60).round
  end
end
