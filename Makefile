########################################################################################################################
##
## HELP
##
########################################################################################################################

# COLORS
YELLOW = $(shell printf "\33[33m")
GREEN  = $(shell printf "\33[32m")
RED    = $(shell printf "\33[31m")
WHITE  = $(shell printf "\33[37m")
RESET  = $(shell printf "\33[0m")

# Add the following 'help' target to your Makefile
# And add help text after each target name starting with '\#\#'
# A category can be added with @category
HELP_HELPER = \
    %help; \
    while(<>) { push @{$$help{$$2 // 'options'}}, [$$1, $$3] if /^([a-zA-Z\-_\%]+)\s*:.*\#\#(?:@([a-zA-Z\-\%]+))?\s(.*)$$/ }; \
    print "usage: make [target]\n\n"; \
    for (sort keys %help) { \
    print "${WHITE}$$_:${RESET}\n"; \
    for (@{$$help{$$_}}) { \
    $$sep = " " x (32 - length $$_->[0]); \
    print "  ${YELLOW}$$_->[0]${RESET}$$sep${GREEN}$$_->[1]${RESET}\n"; \
    }; \
    print "\n"; }

help: ##@help prints help
	@perl -e '$(HELP_HELPER)' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

########################################################################################################################
##
## GLOBAL
##
########################################################################################################################

capture_%: ##@surveys take screenshots of the survey's results, ex: survey_capture_2018
	@./cli/cli capture ${*}