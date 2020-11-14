import React from 'react';
import { shallow } from 'enzyme';
import TOS from './../TOS.jsx';


test('should test Login component', () => {
    const wrapper = shallow(<TOS />);
    expect(wrapper).toMatchSnapshot();
});