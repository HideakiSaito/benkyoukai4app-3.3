module EasyGantt

  def self.non_working_week_days
    if User.current.respond_to?(:current_working_time_calendar) && User.current.current_working_time_calendar.respond_to?(:working_week_days)
      working_days = User.current.current_working_time_calendar.working_week_days.map(&:to_i)
    else
      working_days = []
    end

    if working_days.any?
      ((1..7).to_a - working_days)
    elsif Setting.respond_to?(:non_working_week_days) && Setting.non_working_week_days.is_a?(Array) && Setting.non_working_week_days.any?
      Setting.non_working_week_days.map(&:to_i)
    else
      [6, 7]
    end
  end

  def self.easy_extensions?
    Redmine::Plugin.installed?(:easy_extensions)
  end

end
