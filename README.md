# Timetable changes

This is a tool to help visualise rail service patterns in the UK before and after the May 2018 timetable change. [See it in action](https://changes.chriszetter.com) and [read more about it](https://chriszetter.com/blog/2018/05/11/visualizing-changes-to-rail-services/).


### Setup

This tool requires Ruby and Redis to be installed.

1. Run `bundle install`
2. Setup an application an [transportapi.com](https://developer.transportapi.com/) (free to register)
3. Run the server locally after setting the `app_id` and `app_key` from your application in your env. E.g: `app_id=1234 app_key=abcd bundle exec rails server`
