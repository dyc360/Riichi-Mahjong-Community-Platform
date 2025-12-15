#!/usr/bin/env python
# -*- coding: utf-8 -*-
from mleague.scraper import MLeagueOfficialScraper

def test_historical_season():
    scraper = MLeagueOfficialScraper()
    print('Testing historical season data fetching for 2024...')

    schedule_2024 = scraper.fetch_schedule(year=2024)
    print(f'Found {len(schedule_2024)} matches for 2024')

    if schedule_2024:
        print('Sample matches:')
        for i, match in enumerate(schedule_2024[:2]):
            print(f'  {i+1}. {match["date"]}: {len(match["teams"])} teams - ID: {match["match_id"]}')
            for j, team in enumerate(match['teams']):
                print(f'     {j+1}. {repr(team["name"])}')

        # 验证数据结构
        print('\nData validation:')
        for match in schedule_2024[:3]:
            print(f'  Match {match["date"]}: year={match["year"]}, month={match["month"]}, day={match["day"]}, status={match["status"]}')

if __name__ == '__main__':
    test_historical_season()