Redmine::Plugin.register :easy_gantt do
  name 'Easy Gantt plugin'
  author 'Easy Software Ltd'
  description 'Cool gantt for redmine'
  version '1.4'
  url 'www.easyredmine.com'
  author_url 'www.easysoftware.cz'

  settings partial: 'nil', only_easy: true, easy_settings: {
    show_holidays: false,
    show_project_progress: true,
    critical_path: 'last',
    default_zoom: 'day',
    show_lowest_progress_tasks: false
  }
end

# unless Redmine::Plugin.installed?(:easy_hosting_services)
  require File.join(File.dirname(__FILE__), 'after_init')
# end
