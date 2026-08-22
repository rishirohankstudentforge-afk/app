#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <fstream>
#include <cstdlib>
#include <ctime>

using namespace std;

int solve_query(const string& s, int L, int R) {
    string sub = s.substr(L, R - L + 1);
    int c = 0;
    for (char ch : sub) if (ch == '1') c++;
    
    vector<pair<char, int>> blocks;
    int i = 0;
    int n = sub.length();
    while (i < n) {
        char ch = sub[i];
        int start = i;
        while (i < n && sub[i] == ch) i++;
        blocks.push_back({ch, i - start});
    }
    
    int max_1s = c;
    for (int j = 1; j < (int)blocks.size() - 1; j++) {
        if (blocks[j].first == '1') {
            int L_i = blocks[j].second;
            int Z_L = blocks[j-1].second;
            int Z_R = blocks[j+1].second;
            
            int Z_max = 0;
            for (int k = 0; k < blocks.size(); k++) {
                if (blocks[k].first == '0') {
                    Z_max = max(Z_max, blocks[k].second);
                }
            }
            
            int new_Z = Z_L + L_i + Z_R;
            int gain = max(Z_max, new_Z) - L_i;
            max_1s = max(max_1s, c + gain);
        }
    }
    return max_1s;
}

vector<int> solve(const string& s, const vector<pair<int, int>>& queries) {
    vector<int> ans;
    for (auto& q : queries) {
        ans.push_back(solve_query(s, q.first, q.second));
    }
    return ans;
}

int main() {
    srand(time(NULL));
    
    string s = "1000100";
    vector<pair<int,int>> q = {{1,5},{0,6},{0,4}};
    vector<int> res = solve(s, q);
    for(int x : res) cout << x << " ";
    cout << endl;

    // Generate test cases
    ofstream out("scratch/expert_cases_new.json");
    out << "[\n";
    
    for (int t = 0; t < 15; t++) {
        int n, q_count;
        if (t < 4) { // medium
            n = 5000 + rand() % 1000;
            q_count = 5000 + rand() % 1000;
        } else { // hard
            n = 10000;
            q_count = 10000;
        }
        
        string s_gen = "";
        for (int i = 0; i < n; i++) {
            s_gen += (rand() % 2 == 0 ? '0' : '1');
        }
        
        vector<pair<int,int>> queries_gen;
        string queries_str = "[";
        for (int i = 0; i < q_count; i++) {
            int L = rand() % n;
            int R = rand() % n;
            if (L > R) swap(L, R);
            queries_gen.push_back({L, R});
            queries_str += "[" + to_string(L) + "," + to_string(R) + "]";
            if (i < q_count - 1) queries_str += ",";
        }
        queries_str += "]";
        
        vector<int> ans_gen = solve(s_gen, queries_gen);
        string ans_str = "[";
        for (int i = 0; i < q_count; i++) {
            ans_str += to_string(ans_gen[i]);
            if (i < q_count - 1) ans_str += ",";
        }
        ans_str += "]";
        
        out << "  {\n";
        out << "    \"input\": \"\\\"" << s_gen << "\\\"\\n" << queries_str << "\",\n";
        out << "    \"expectedOutput\": \"" << ans_str << "\"\n";
        out << "  }";
        if (t < 14) out << ",";
        out << "\n";
        
        cout << "Generated case " << t + 1 << endl;
    }
    
    out << "]\n";
    out.close();
    return 0;
}
