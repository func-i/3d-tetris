desc "compile and run the site"
task :default do
  pids = [
    spawn("jekyll serve -w"), # put `auto: true` in your _config.yml
    #spawn("scss --watch scss:css"),
    #spawn("watch-lessc -i less/style.less -o css/style.css"),
    #spawn("coffee -o js/ -cw coffee/")
  ]
 
  trap "INT" do
    Process.kill "INT", *pids
    exit 1
  end
 
  loop do
    sleep 1
  end
end