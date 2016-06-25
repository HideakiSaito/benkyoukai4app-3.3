scope '(projects/:project_id)' do
  resource :easy_gantt, :controller => 'easy_gantt', :only => [:index] do
    member do
      get 'issues'
      get 'projects'
      put 'relation/:id(.:format)', :to => 'easy_gantt#change_issue_relation_delay', :as => 'relation'
    end
  end
end
